const express = require('express')
const bcrypt = require('bcrypt')
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const {
  PROVIDERS,
  canUnlinkProvider,
  buildConnectionsResponse,
} = require('../lib/connections')

const router = express.Router()
const BCRYPT_COST = 12

const AUTH_FIELDS = `id, email, password_hash, google_id, github_id, orcid_id, email_verified`

async function getAuthUser(userId) {
  const result = await pool.query(
    `SELECT ${AUTH_FIELDS} FROM users WHERE id = $1`,
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
  let client
  try {
    const { provider } = req.params
    if (!PROVIDERS.includes(provider)) {
      return res.status(400).json({ error: 'Invalid provider' })
    }

    client = await pool.connect()
    await client.query('BEGIN')

    const result = await client.query(
      `SELECT ${AUTH_FIELDS} FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.userId]
    )
    const user = result.rows[0] || null
    if (!user) {
      await client.query('ROLLBACK')
      return res.status(404).json({ error: 'User not found' })
    }

    if (!canUnlinkProvider(user, provider)) {
      await client.query('ROLLBACK')
      return res.status(400).json({
        error: 'Add another sign-in method before removing this one',
        code: 'LAST_SIGN_IN_METHOD',
      })
    }

    const columnMap = {
      password: 'password_hash',
      google: 'google_id',
      github: 'github_id',
      orcid: 'orcid_id',
    }

    await client.query(
      `UPDATE users SET ${columnMap[provider]} = NULL WHERE id = $1`,
      [req.user.userId]
    )

    const updatedResult = await client.query(
      `SELECT ${AUTH_FIELDS} FROM users WHERE id = $1`,
      [req.user.userId]
    )
    await client.query('COMMIT')

    const updated = updatedResult.rows[0]
    res.json(buildConnectionsResponse(updated))
  } catch (err) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (_rollbackErr) {
        // Preserve the original error for logging and response handling.
      }
    }
    console.error('DELETE /users/me/connections/:provider error:', err)
    res.status(500).json({ error: 'Internal server error' })
  } finally {
    if (client) client.release()
  }
})

module.exports = router
