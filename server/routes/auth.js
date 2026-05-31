const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const db = require('../db')

const router = express.Router()

const BCRYPT_COST = 12
const JWT_EXPIRY = '7d'
const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function setTokenCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
  })
}

// POST /auth/register
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

// POST /auth/login
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

// GET /auth/me
router.get('/me', authenticateToken, async (req, res) => {
  const result = await db.query(
    'SELECT id, username, email, created_at FROM users WHERE id = $1',
    [req.user.userId]
  )
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' })
  res.json(result.rows[0])
})

module.exports = router