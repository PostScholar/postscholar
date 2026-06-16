const express = require('express')
const jwt = require('jsonwebtoken')
const {
  signToken,
  setTokenCookie,
  signOAuthState,
  verifyOAuthState,
} = require('../lib/session')
const { formatUserResponse, linkOAuthProvider } = require('../lib/oauthUsers')
const { findOrCreateOAuthUser } = require('./google')
const authenticateToken = require('../middleware/authenticateToken')

const router = express.Router()

const GITHUB_AUTH_URL = 'https://github.com/login/oauth/authorize'
const GITHUB_TOKEN_URL = 'https://github.com/login/oauth/access_token'

function getUserIdFromCookie(req) {
  const token = req.cookies?.token
  if (!token) return null
  try {
    return jwt.verify(token, process.env.JWT_SECRET).userId
  } catch {
    return null
  }
}

function buildGithubAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.GITHUB_CLIENT_ID,
    redirect_uri: `${process.env.CLIENT_URL}/auth/github/callback`,
    scope: 'read:user user:email',
    state,
  })
  return `${GITHUB_AUTH_URL}?${params.toString()}`
}

router.get('/url', (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(503).json({ error: 'GitHub sign-in is not configured' })
  }
  const state = signOAuthState({ provider: 'github', mode: 'login' })
  res.json({ url: buildGithubAuthUrl(state) })
})

router.get('/link/url', authenticateToken, (req, res) => {
  if (!process.env.GITHUB_CLIENT_ID) {
    return res.status(503).json({ error: 'GitHub sign-in is not configured' })
  }
  const state = signOAuthState({
    provider: 'github',
    mode: 'link',
    userId: req.user.userId,
  })
  res.json({ url: buildGithubAuthUrl(state) })
})

async function fetchGithubProfile(code) {
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

  if (!tokenRes.ok) return null

  const tokenData = await tokenRes.json()
  const accessToken = tokenData.access_token
  if (!accessToken) return null

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

  if (!profileRes.ok) return null

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

  return {
    profile,
    email,
    emailVerified,
    providerId: String(profile.id),
    displayName: profile.name || profile.login,
    usernameBase: profile.login || email?.split('@')[0] || 'user',
  }
}

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

    const githubData = await fetchGithubProfile(code)
    if (!githubData) {
      return res.status(502).json({ error: 'Failed to obtain GitHub access token' })
    }

    if (statePayload.mode === 'link') {
      const userId = getUserIdFromCookie(req)
      if (!userId || userId !== statePayload.userId) {
        return res.status(403).json({ error: 'Session mismatch' })
      }
      try {
        await linkOAuthProvider(userId, 'github', githubData.providerId, {
          email: githubData.email,
          emailVerified: githubData.emailVerified,
          displayName: githubData.displayName,
        })
      } catch (err) {
        const status = ['PROVIDER_TAKEN', 'EMAIL_TAKEN'].includes(err.code) ? 409 : 400
        return res.status(status).json({ error: err.message })
      }
      return res.json({ linked: true, provider: 'github', mode: 'link' })
    }

    const user = await findOrCreateOAuthUser({
      provider: 'github',
      providerId: githubData.providerId,
      email: githubData.email,
      emailVerified: githubData.emailVerified,
      displayName: githubData.displayName,
      usernameBase: githubData.usernameBase,
    })

    const sessionToken = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, sessionToken)
    res.json(formatUserResponse(user))
  } catch (err) {
    if (err.statusCode) {
      return res.status(err.statusCode).json({
        error: err.message,
        ...(err.code ? { code: err.code } : {}),
      })
    }
    console.error('POST /auth/github/callback error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
