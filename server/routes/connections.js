const express = require('express')
const bcrypt = require('bcrypt')
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const {
  PROVIDERS,
  buildConnectionsResponse,
} = require('../lib/connections')

const router = express.Router()
const BCRYPT_COST = 12

const AUTH_FIELDS = `id, email, password_hash, google_id, github_id, orcid_id, email_verified`
const SIGN_IN_METHOD_COUNT_SQL = `(
  CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN google_id IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN github_id IS NOT NULL THEN 1 ELSE 0 END +
  CASE WHEN orcid_id IS NOT NULL THEN 1 ELSE 0 END
)`
const COLUMN_BY_PROVIDER = {
  password: 'password_hash',
  google: 'google_id',
  github: 'github_id',
  orcid: 'orcid_id',
}

async function getAuthUser(userId) {
  const result = await pool.query(
    `SELECT ${AUTH_FIELDS} FROM users WHERE id = $1`,
    [userId]
  )
  return result.rows[0] || null
}

async function unlinkProvider(userId, provider) {
  const column = COLUMN_BY_PROVIDER[provider]
  if (!column) return null

  const result = await pool.query(
    `UPDATE users
     SET ${column} = NULL
     WHERE id = $1
       AND ${column} IS NOT NULL
       AND ${SIGN_IN_METHOD_COUNT_SQL} > 1
     RETURNING ${AUTH_FIELDS}`,
    [userId]
  )
  return result.rows[0] || null
}

router.get('/', authenticateToken, async (req, res) => {
  try {
    const user = await getAuthUser(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })
    res.json(buildConnectionsResponse(user))
  } catch (err) {
    console.error('GET /users/me/connections error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' })
    }

    const user = await getAuthUser(req.user.userId)
    if (!user) return res.status(404).json({ error: 'User not found' })

    if (user.password_hash) {
      return res.status(409).json({ error: 'Password is already set on this account' })
    }

    if (!user.email) {
      return res.status(400).json({
        error: 'Link Google or GitHub (with a visible email) before setting a password',
      })
    }

    const password_hash = await bcrypt.hash(password, BCRYPT_COST)
    await pool.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [password_hash, req.user.userId]
    )

    const updated = await getAuthUser(req.user.userId)
    res.json(buildConnectionsResponse(updated))
  } catch (err) {
    console.error('POST /users/me/connections/password error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:provider', authenticateToken, async (req, res) => {
  try {
    const { provider } = req.params
    if (!PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' })
    }

    const updated = await unlinkProvider(req.user.userId, provider)
    if (!updated) {
      const user = await getAuthUser(req.user.userId)
      if (!user) return res.status(404).json({ error: 'User not found' })
      return res.status(400).json({
        error: 'Add another sign-in method before removing this one',
        code: 'LAST_SIGN_IN_METHOD',
      })
    }

    res.json(buildConnectionsResponse(updated))
  } catch (err) {
    console.error('DELETE /users/me/connections/:provider error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
module.exports.unlinkProvider = unlinkProvider
