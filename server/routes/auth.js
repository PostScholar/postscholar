const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()

// bcrypt cost factor — 12 is slow enough to resist brute force,
// fast enough to not noticeably delay login
const BCRYPT_COST = 12

// JWT expiry — 7 days, stored in an httpOnly cookie
const JWT_EXPIRY = '7d'

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
 * setTokenCookie(res, token)
 * Sets the JWT as an httpOnly cookie.
 * - sameSite: 'none' in production (required for cross-origin requests
 *   between postscholar.org and Railway backend)
 * - sameSite: 'strict' in development (same origin, more secure)
 * - secure: true in production only (https required for sameSite: none)
 */
function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds
  })
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
    'INSERT INTO users (email, username, password_hash) VALUES ($1, $2, $3) RETURNING id, username',
    [email, username, password_hash]
  )
  const user = result.rows[0]

  const token = signToken({ userId: user.id, username: user.username })
  setTokenCookie(res, token)

  res.status(201).json({ username: user.username })
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
    'SELECT id, username, password_hash FROM users WHERE email = $1',
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

  res.status(200).json({ username: user.username })
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
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [req.user.userId]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json(result.rows[0])
})

module.exports = router
