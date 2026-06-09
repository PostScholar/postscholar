const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

// ---------------------------------------------------------------------------
// POST /follows/:username
// ---------------------------------------------------------------------------
// Follow a user
// ---------------------------------------------------------------------------
router.post('/:username', authenticateToken, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const targetId = target.rows[0].id
    if (targetId === req.user.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' })
    }

    await pool.query(
      `INSERT INTO follows (follower_id, following_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.userId, targetId]
    )
    res.json({ following: true })
  } catch (err) {
    console.error('POST /follows error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /follows/:username
// ---------------------------------------------------------------------------
// Unfollow a user
// ---------------------------------------------------------------------------
router.delete('/:username', authenticateToken, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    await pool.query(
      'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.userId, target.rows[0].id]
    )
    res.json({ following: false })
  } catch (err) {
    console.error('DELETE /follows error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /follows/:username/status
// ---------------------------------------------------------------------------
// Check if current user is following this user
// ---------------------------------------------------------------------------
router.get('/:username/status', authenticateToken, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = await pool.query(
      'SELECT 1 FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.user.userId, target.rows[0].id]
    )
    res.json({ following: result.rows.length > 0 })
  } catch (err) {
    console.error('GET /follows/status error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /follows/:username/counts
// ---------------------------------------------------------------------------
// Get follower and following counts
// ---------------------------------------------------------------------------
router.get('/:username/counts', optionalAuth, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const [followers, following] = await Promise.all([
      pool.query(
        'SELECT COUNT(*) as count FROM follows WHERE following_id = $1',
        [target.rows[0].id]
      ),
      pool.query(
        'SELECT COUNT(*) as count FROM follows WHERE follower_id = $1',
        [target.rows[0].id]
      )
    ])

    res.json({
      followers: parseInt(followers.rows[0].count),
      following: parseInt(following.rows[0].count)
    })
  } catch (err) {
    console.error('GET /follows/counts error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /follows/:username/followers
// ---------------------------------------------------------------------------
// List followers
// ---------------------------------------------------------------------------
router.get('/:username/followers', optionalAuth, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.created_at, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.follower_id = u.id
       WHERE f.following_id = $1
       ORDER BY f.created_at DESC
       LIMIT 50`,
      [target.rows[0].id]
    )

    res.json({ followers: result.rows })
  } catch (err) {
    console.error('GET /follows/followers error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /follows/:username/following
// ---------------------------------------------------------------------------
// List who this user is following
// ---------------------------------------------------------------------------
router.get('/:username/following', optionalAuth, async (req, res) => {
  try {
    const target = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [req.params.username]
    )
    if (target.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const result = await pool.query(
      `SELECT u.id, u.username, u.bio, u.created_at, f.created_at as followed_at
       FROM follows f
       JOIN users u ON f.following_id = u.id
       WHERE f.follower_id = $1
       ORDER BY f.created_at DESC
       LIMIT 50`,
      [target.rows[0].id]
    )

    res.json({ following: result.rows })
  } catch (err) {
    console.error('GET /follows/following error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
