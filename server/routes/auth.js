const express = require('express')
const bcrypt = require('bcrypt')
const crypto = require('crypto')
const db = require('../db')
const {
  signToken,
  setTokenCookie,
  clearTokenCookie,
  verifyCompletionToken,
} = require('../lib/session')
const {
  USERNAME_REGEX,
  formatUserResponse,
} = require('../lib/oauthUsers')

const router = express.Router()
const authenticateToken = require('../middleware/authenticateToken')

const BCRYPT_COST = 12
const RESET_TOKEN_EXPIRY_MS = 60 * 60 * 1000
const VERIFY_TOKEN_EXPIRY_MS = 24 * 60 * 60 * 1000
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DUMMY_HASH = '$2b$12$invalidhashfortimingprotectiononly000000000000000000000'

function hashToken(rawToken) {
  return crypto.createHash('sha256').update(rawToken).digest('hex')
}

async function sendEmail({ to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'PostScholar <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Resend error: ${JSON.stringify(err)}`)
  }
}

async function sendResetEmail(email, resetUrl) {
  await sendEmail({
    to: email,
    subject: 'Reset your PostScholar password',
    html: `
      <p>You requested a password reset for your PostScholar account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <p><a href="${resetUrl}">${resetUrl}</a></p>
      <p>If you did not request this, you can ignore this email.</p>
    `,
  })
}

async function sendVerificationEmail(email, verifyUrl) {
  if (process.env.NODE_ENV === 'test') return
  await sendEmail({
    to: email,
    subject: 'Verify your PostScholar email',
    html: `
      <p>Welcome to PostScholar. Please verify your email address to post comments and start discussions.</p>
      <p><a href="${verifyUrl}">${verifyUrl}</a></p>
      <p>This link expires in 24 hours. You can browse discussions while you wait.</p>
    `,
  })
}

async function issueVerificationToken(userId) {
  const rawToken = crypto.randomBytes(32).toString('hex')
  const tokenHash = hashToken(rawToken)
  const expiresAt = new Date(Date.now() + VERIFY_TOKEN_EXPIRY_MS)

  await db.query(
    'UPDATE email_verification_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
    [userId]
  )
  await db.query(
    'INSERT INTO email_verification_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
    [userId, tokenHash, expiresAt]
  )

  return rawToken
}

router.post('/register', async (req, res) => {
  try {
    const { email, username, password } = req.body

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Invalid email' })
    }
    if (!username || !USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters, lowercase letters, numbers, and underscores only',
      })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const existing = await db.query(
      'SELECT id FROM users WHERE email = $1 OR username = $2',
      [email, username]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Email or username already taken' })
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_COST)
    const result = await db.query(
      `INSERT INTO users (email, username, password_hash, email_verified)
       VALUES ($1, $2, $3, false)
       RETURNING id, username, email, display_name, role, email_verified`,
      [email, username, password_hash]
    )
    const user = result.rows[0]

    const token = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, token)

    try {
      const rawToken = await issueVerificationToken(user.id)
      const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`
      await sendVerificationEmail(user.email, verifyUrl)
    } catch (err) {
      console.error('Verification email failed:', err)
    }

    res.status(201).json(formatUserResponse(user))
  } catch (err) {
    console.error('POST /auth/register error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' })
    }

    const result = await db.query(
      `SELECT id, username, email, password_hash, display_name, role, email_verified,
              google_id, github_id, orcid_id
       FROM users WHERE email = $1`,
      [email]
    )
    const user = result.rows[0]

    if (user && !user.password_hash && (user.google_id || user.github_id || user.orcid_id)) {
      return res.status(400).json({
        error: 'This account uses social sign-in. Please continue with ORCID, Google, or GitHub.',
      })
    }

    const hashToCompare = user?.password_hash || DUMMY_HASH
    const match = await bcrypt.compare(password, hashToCompare)

    if (!user || !match) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const token = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, token)
    res.status(200).json(formatUserResponse(user))
  } catch (err) {
    console.error('POST /auth/login error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me', authenticateToken, async (req, res) => {
  const result = await db.query(
    `SELECT id, username, email, display_name, role, created_at, email_verified
     FROM users WHERE id = $1`,
    [req.user.userId]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json(result.rows[0])
})

router.post('/logout', (req, res) => {
  clearTokenCookie(res)
  res.json({ ok: true })
})

router.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query
    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' })
    }

    const tokenHash = hashToken(token)
    const tokenResult = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM email_verification_tokens WHERE token_hash = $1`,
      [tokenHash]
    )
    const verifyToken = tokenResult.rows[0]

    if (!verifyToken) {
      return res.status(400).json({ error: 'Invalid or expired verification token' })
    }
    if (verifyToken.used_at) {
      return res.status(400).json({ error: 'Verification token has already been used' })
    }
    if (new Date() > new Date(verifyToken.expires_at)) {
      return res.status(400).json({ error: 'Verification token has expired' })
    }

    const client = await db.connect()
    try {
      await client.query('BEGIN')
      await client.query(
        'UPDATE users SET email_verified = true WHERE id = $1',
        [verifyToken.user_id]
      )
      await client.query(
        'UPDATE email_verification_tokens SET used_at = NOW() WHERE id = $1',
        [verifyToken.id]
      )
      await client.query('COMMIT')
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }

    res.json({ message: 'Email verified successfully' })
  } catch (err) {
    console.error('GET /auth/verify-email error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/resend-verification', authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      'SELECT id, email, email_verified FROM users WHERE id = $1',
      [req.user.userId]
    )
    const user = result.rows[0]
    if (!user) return res.status(404).json({ error: 'User not found' })
    if (user.email_verified) {
      return res.json({ message: 'Email already verified' })
    }

    const rawToken = await issueVerificationToken(user.id)
    const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${rawToken}`
    await sendVerificationEmail(user.email, verifyUrl)

    res.json({ message: 'Verification email sent' })
  } catch (err) {
    console.error('POST /auth/resend-verification error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/complete', async (req, res) => {
  try {
    const { token, username, display_name } = req.body

    if (!token || !username) {
      return res.status(400).json({ error: 'Token and username are required' })
    }
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        error: 'Username must be 3–30 characters, lowercase letters, numbers, and underscores only',
      })
    }
    if (display_name && display_name.trim().length > 50) {
      return res.status(400).json({ error: 'Display name must be 50 characters or fewer' })
    }

    const payload = verifyCompletionToken(token)
    if (!payload || payload.mode !== 'orcid_complete' || !payload.orcid_id) {
      return res.status(400).json({ error: 'Invalid or expired completion token' })
    }

    const existingOrcid = await db.query(
      'SELECT id FROM users WHERE orcid_id = $1',
      [payload.orcid_id]
    )
    if (existingOrcid.rows.length > 0) {
      return res.status(409).json({ error: 'ORCID account already registered' })
    }

    const existingUsername = await db.query(
      'SELECT id FROM users WHERE username = $1',
      [username]
    )
    if (existingUsername.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' })
    }

    const result = await db.query(
      `INSERT INTO users (username, email, orcid_id, display_name, email_verified)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, email, display_name, role, email_verified`,
      [
        username,
        payload.email || null,
        payload.orcid_id,
        display_name?.trim() || payload.display_name || null,
      ]
    )
    const user = result.rows[0]

    const sessionToken = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, sessionToken)

    res.status(201).json(formatUserResponse(user))
  } catch (err) {
    console.error('POST /auth/complete error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email || !EMAIL_REGEX.test(email)) {
      return res.status(400).json({ error: 'Valid email is required' })
    }

    const result = await db.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    )
    const user = result.rows[0]

    if (!user) {
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }

    if (!user.password_hash) {
      return res.json({ message: 'If that email exists, a reset link has been sent' })
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const tokenHash = hashToken(rawToken)
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_MS)

    await db.query(
      'UPDATE password_reset_tokens SET used_at = NOW() WHERE user_id = $1 AND used_at IS NULL',
      [user.id]
    )
    await db.query(
      'INSERT INTO password_reset_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, tokenHash, expiresAt]
    )

    const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`
    await sendResetEmail(user.email, resetUrl)

    return res.json({ message: 'If that email exists, a reset link has been sent' })
  } catch (err) {
    console.error('POST /auth/forgot-password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body

    if (!token || typeof token !== 'string') {
      return res.status(400).json({ error: 'Token is required' })
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const tokenHash = hashToken(token)
    const tokenResult = await db.query(
      `SELECT id, user_id, expires_at, used_at
       FROM password_reset_tokens WHERE token_hash = $1`,
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
