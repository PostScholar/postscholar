const express = require('express')
const {
  signToken,
  setTokenCookie,
  signOAuthState,
  verifyOAuthState,
} = require('../lib/session')
const { formatUserResponse } = require('../lib/oauthUsers')
const { findOrCreateOAuthUser } = require('./google')

const router = express.Router()

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

router.get('/url', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(503).json({ error: 'GitHub sign-in is not configured' })
  }

  const state = signOAuthState({ provider: 'github', mode: 'login' })
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.CLIENT_URL}/auth/github/callback`,
    scope: 'read:user user:email',
    state,
  })

  res.json({ url: `${GITHUB_AUTH_URL}?${params.toString()}` })
})

router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body
    if (!code || !state) {
      return res.status(400).json({ error: 'code and state are required' })
    }

    const statePayload = verifyOAuthState(state)
    if (!statePayload || statePayload.provider !== 'github') {
      return res.status(400).json({ error: 'Invalid or expired state' })
    }

    const tokenRes = await fetch(GITHUB_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        code,
        client_id: process.env.GITHUB_CLIENT_ID,
        client_secret: process.env.GITHUB_CLIENT_SECRET,
        redirect_uri: `${process.env.CLIENT_URL}/auth/github/callback`,
      }),
    })

    if (!tokenRes.ok) {
      return res.status(502).json({ error: 'Failed to exchange GitHub code' })
    }

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token
    if (!accessToken) {
      return res.status(502).json({ error: 'Failed to obtain GitHub access token' })
    }

    const [profileRes, emailsRes] = await Promise.all([
      fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'PostScholar',
        },
      }),
      fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.github+json',
          'User-Agent': 'PostScholar',
        },
      }),
    ])

    if (!profileRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch GitHub profile' })
    }

    const profile = await profileRes.json()
    let email = profile.email
    let emailVerified = false

    if (emailsRes.ok) {
      const emails = await emailsRes.json()
      const primary = emails.find(e => e.primary && e.verified)
        || emails.find(e => e.verified)
      if (primary) {
        email = primary.email
        emailVerified = primary.verified
      }
    }

    const user = await findOrCreateOAuthUser({
      provider: 'github',
      providerId: String(profile.id),
      email,
      emailVerified,
      displayName: profile.name || profile.login,
      usernameBase: profile.login || email?.split('@')[0] || 'user',
    })

    const sessionToken = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, sessionToken)
    res.json(formatUserResponse(user))
  } catch (err) {
    console.error('POST /auth/github/callback error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
