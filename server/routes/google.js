const express = require('express')
const db = require('../db')
const AppError = require('../lib/AppError')
const {
  signToken,
  setTokenCookie,
  signOAuthState,
  verifyOAuthState,
} = require('../lib/session')
const { findAvailableUsername, formatUserResponse } = require('../lib/oauthUsers')

const router = express.Router()

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const GOOGLE_USERINFO_URL = 'https://www.googleapis.com/oauth2/v2/userinfo'

router.get('/url', (req, res) => {
  if (!process.env.GOOGLE_CLIENT_ID) {
    return res.status(503).json({ error: 'Google sign-in is not configured' })
  }

  const state = signOAuthState({ provider: 'google', mode: 'login' })
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: `${process.env.CLIENT_URL}/auth/google/callback`,
    response_type: 'code',
    scope: 'openid email profile',
    state,
    access_type: 'online',
    prompt: 'select_account',
  })

  res.json({ url: `${GOOGLE_AUTH_URL}?${params.toString()}` })
})

router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body
    if (!code || !state) {
      return res.status(400).json({ error: 'code and state are required' })
    }

    const statePayload = verifyOAuthState(state)
    if (!statePayload || statePayload.provider !== 'google') {
      return res.status(400).json({ error: 'Invalid or expired state' })
    }

    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${process.env.CLIENT_URL}/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    })

    if (!tokenRes.ok) {
      return res.status(502).json({ error: 'Failed to exchange Google code' })
    }

    const tokenData = await tokenRes.json()
    const userRes = await fetch(GOOGLE_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    })

    if (!userRes.ok) {
      return res.status(502).json({ error: 'Failed to fetch Google profile' })
    }

    const profile = await userRes.json()
    if (!profile.id) {
      return res.status(502).json({ error: 'Invalid Google profile' })
    }

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId: profile.id,
      email: profile.email,
      emailVerified: profile.verified_email === true,
      displayName: profile.name,
      usernameBase: profile.email?.split('@')[0] || profile.given_name || 'user',
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
    console.error('POST /auth/google/callback error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function findOrCreateOAuthUser({
  provider,
  providerId,
  email,
  emailVerified,
  displayName,
  usernameBase,
}) {
  const idColumn = provider === 'google' ? 'google_id' : 'github_id'

  const byProvider = await db.query(
    `SELECT id, username, email, display_name, role, email_verified
     FROM users WHERE ${idColumn} = $1`,
    [providerId]
  )
  if (byProvider.rows[0]) return byProvider.rows[0]

  if (email) {
    const byEmail = await db.query(
      `SELECT id, username, email, display_name, role, email_verified, google_id, github_id
       FROM users WHERE email = $1`,
      [email]
    )
    if (byEmail.rows[0]) {
      const existing = byEmail.rows[0]
      if (!existing.email_verified || !emailVerified) {
        throw new AppError(
          'An account already exists for this email. Verify the email on that account before linking a social sign-in.',
          409,
          'OAUTH_EMAIL_REQUIRES_VERIFICATION'
        )
      }
      await db.query(
        `UPDATE users
         SET ${idColumn} = $1,
             email_verified = CASE WHEN $2 THEN true ELSE email_verified END,
             display_name = COALESCE(display_name, $3)
         WHERE id = $4`,
        [providerId, emailVerified, displayName || null, existing.id]
      )
      const updated = await db.query(
        `SELECT id, username, email, display_name, role, email_verified FROM users WHERE id = $1`,
        [existing.id]
      )
      return updated.rows[0]
    }
  }

  const username = await findAvailableUsername(usernameBase)
  const result = await db.query(
    `INSERT INTO users (username, email, ${idColumn}, display_name, email_verified)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, username, email, display_name, role, email_verified`,
    [username, email || null, providerId, displayName || null, emailVerified]
  )
  return result.rows[0]
}

module.exports = router
module.exports.findOrCreateOAuthUser = findOrCreateOAuthUser
