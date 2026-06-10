const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../db')

const router = express.Router()

// bcrypt cost factor — 12 is slow enough to resist brute force,
// fast enough to not noticeably delay login
const BCRYPT_COST = 12

// JWT expiry — 7 days, stored in an httpOnly cookie
const JWT_EXPIRY = '7d'

// Password reset token expiry — 1 hour
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000

// Username: 3-30 chars, lowercase letters, numbers, underscores only
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

// Basic email format check — not exhaustive, just sanity validation
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * signToken(payload)
 * Signs a JWT with the app secret and 7-day expiry.
 * Payload contains { userId, username }.
 */
function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

/**
 * Cookie options for the JWT session.
 * Frontend proxies /api → backend (Vercel/Railway and local dev), so the
 * browser always talks same-origin and lax cookies work — including mobile Safari.
 */
function tokenCookieOptions(maxAge) {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge,
  }
}

function setTokenCookie(res, token) {
  res.cookie('token', token, tokenCookieOptions(7 * 24 * 60 * 60 * 1000))
}

function clearTokenCookie(res) {
  res.cookie('token', '', tokenCookieOptions(0))
}

/**
 * hashToken(rawToken)
 * SHA-256 hashes a raw token before storing in the DB.
 * We store only the hash so that a DB leak doesn't expose valid reset tokens,
 * similar to how we store password hashes instead of plaintext passwords.
 */
function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

/**
 * sendResetEmail(email, resetUrl)
 * Sends a password reset email via Resend.
 * Uses onboarding@resend.dev as the sender until a custom domain is verified.
 */
async function sendResetEmail(email, resetUrl) {
  // console.log('Resend key loaded:', !!process.env.RESEND_API_KEY)
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'PostScholar <onboarding@resend.dev>',
      to: email,
      subject: 'Reset your PostScholar password',
      html: `
        <p>You requested a password reset for your PostScholar account.</p>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p>If you did not request this, you can ignore this email.</p>
      `
    })
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Resend error: ${JSON.stringify(err)}`)
  }
}

// ---------------------------------------------------------------------------
// POST /auth/register
// ---------------------------------------------------------------------------
// Creates a new user account, hashes the password with bcrypt, signs a JWT,
// and sets it as an httpOnly cookie. Returns only the username on success.
// ---------------------------------------------------------------------------
router.post('/register', async (req, res) => {
  const { email, username, password } = req.body

  if (!email || !EMAIL_REGEX.test(email)) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  if (!username || !USERNAME_REGEX.test(username)) {
    return res.status(400).json({ error: 'Username must be 3–30 characters, lowercase letters, numbers, and underscores only' })
  }
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters' })
  }

  // Check for duplicate email or username in one query
  const existing = await db.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  )
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Email or username already taken' })
  }

  const password_hash = await bcrypt.hash(password, BCRYPT_COST)

  const result = await db.query(
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, role',
    [email, username, password_hash]
  )
  const user = result.rows[0]

  const token = signToken({ userId: user.id, username: user.username })
  setTokenCookie(res, token)

  res.status(201).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
  })
})

// ---------------------------------------------------------------------------
// POST /auth/login
// ---------------------------------------------------------------------------
// Validates email + password, sets a new JWT cookie on success.
//
// Timing attack protection: if the user is not found, we still run bcrypt
// compare against a dummy hash. This ensures the response time is the same
// whether the email exists or not, preventing user enumeration via timing.
// ---------------------------------------------------------------------------
const DUMMY_HASH = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000'

router.post('/login', async (req, res) => {
  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' })
  }

  const result = await db.query(
    'SELECT id, username, email, password_hash, role FROM users WHERE email = $1',
    [email]
  )
  const user = result.rows[0]

  // Always run bcrypt.compare even if user not found (timing protection)
  const hashToCompare = user ? user.password_hash : DUMMY_HASH
  const match = await bcrypt.compare(password, hashToCompare)

  if (!user || !match) {
    return res.status(401).json({ error: 'Invalid email or password' })
  }

  const token = signToken({ userId: user.id, username: user.username })
  setTokenCookie(res, token)

  res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role || 'user',
  })
})

const authenticateToken = require('../middleware/authenticateToken')

// ---------------------------------------------------------------------------
// GET /auth/me
// ---------------------------------------------------------------------------
// Protected. Returns the currently authenticated user's profile.
// Used by the frontend AuthContext on page load to restore session state.
// ---------------------------------------------------------------------------
router.get('/me', authenticateToken, async (req, res) => {
  const result = await db.query(
    'SELECT id, username, email, role, created_at FROM users WHERE id = $1',
    [req.user.userId]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json(result.rows[0])
})

router.post('/logout', (req, res) => {
  clearTokenCookie(res)
  res.json({ ok: true })
})

// ---------------------------------------------------------------------------
// POST /auth/forgot-password
// ---------------------------------------------------------------------------
// Accepts an email address and sends a password reset link if the account
// exists. Always returns 200 regardless of whether the email was found —
// this prevents user enumeration (attacker can't tell if an email is registered
// by observing the response).
//
// Flow:
//   1. Look up user by email
//   2. Generate a cryptographically random 32-byte token
//   3. Hash it with SHA-256 and store in password_reset_tokens
//   4. Send the raw token in a reset link via Resend
// ---------------------------------------------------------------------------
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const result = await db.query(
      'SELECT id, email FROM users WHERE email = $1',
      [email]
    )
    const user = result.rows[0]

    // Always return success to prevent user enumeration
    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }

    // Generate a secure random token — 32 bytes = 64 hex chars
    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS)

    // Invalidate any existing unused tokens for this user before creating a new one
    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    )

    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    )

    // Build the reset URL — frontend will extract the token from the query string
    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`

    await sendResetEmail(user.email, resetUrl)

    return res.json({ message: 'If that email exists, a reset link has been sent' })
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// POST /auth/reset-password
// ---------------------------------------------------------------------------
// Accepts a raw reset token and a new password. Validates the token, updates
// the password, and marks the token as used — all in a transaction.
//
// Body params:
//   token       (string) — raw token from the reset link query string
//   password    (string) — new password, min 8 chars
// ---------------------------------------------------------------------------
router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    // Hash the incoming token to compare against stored hash
    const tokenHash = hashToken(token)

    const tokenResult = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens
       WHERE token_hash = $1`,
      [tokenHash]
    )

    const resetToken = tokenResult.rows[0]

    if (!resetToken) {
      return res.status(400).json({ error: 'Invalid or expired reset token' })
    }
    if (resetToken.used_at) {
      return res.status(400).json({ error: 'Reset token has already been used' })
    }
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({ error: 'Reset token has expired' })
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_COST)

    // Update password and mark token as used in a transaction
    const client = await db.connect()
    try {
      await client.query('BEGIN')

      await client.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [password_hash, resetToken.user_id]
      )

      await client.query(
        'UPDATE password_reset_tokens SET used_at = NOW() WHERE id = $1',
        [resetToken.id]
      )

      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    return res.json({ message: 'Password reset successfully' })
  } catch (err) {
    console.error('POST /auth/reset-password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

