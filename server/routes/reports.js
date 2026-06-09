const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

// ---------------------------------------------------------------------------
// POST /reports
// ---------------------------------------------------------------------------
// Submit a report for a comment or discussion
// ---------------------------------------------------------------------------
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { comment_id, discussion_id, reason, description } = req.body

    if (!reason) return res.status(400).json({ error: 'Reason is required' })
    if (!comment_id && !discussion_id) {
      return res.status(400).json({ error: 'Must report a comment or discussion' })
    }

    const validReasons = ['spam', 'harassment', 'offtopic', 'misinformation', 'other']
    if (!validReasons.includes(reason)) {
      return res.status(400).json({ error: 'Invalid reason' })
    }

    const result = await pool.query(
      `INSERT INTO reports (reporter_id, comment_id, discussion_id, reason, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id`,
      [req.user.userId, comment_id || null, discussion_id || null, reason, description || null]
    )

    res.status(201).json({ reported: true, id: result.rows[0].id })
  } catch (err) {
    console.error('POST /reports error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /reports
// ---------------------------------------------------------------------------
// List reports (moderator only - TODO: add role check)
// ---------------------------------------------------------------------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    // TODO: Add role check for moderator/admin
    const { status = 'pending' } = req.query

    const result = await pool.query(
      `SELECT
        r.*,
        u.username as reporter_username,
        c.body as comment_body,
        cu.username as comment_author
       FROM reports r
       JOIN users u ON r.reporter_id = u.id
       LEFT JOIN comments c ON r.comment_id = c.id
       LEFT JOIN users cu ON c.user_id = cu.id
       WHERE r.status = $1
       ORDER BY r.created_at DESC
       LIMIT 50`,
      [status]
    )

    res.json({ reports: result.rows })
  } catch (err) {
    console.error('GET /reports error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /reports/:id
// ---------------------------------------------------------------------------
// Update report status (moderator only - TODO: add role check)
// ---------------------------------------------------------------------------
router.patch('/:id', authenticateToken, async (req, res) => {
  try {
    // TODO: Add role check for moderator/admin
    const { status } = req.body

    if (!status || !['pending', 'reviewed', 'actioned', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' })
    }

    await pool.query(
      'UPDATE reports SET status = $1 WHERE id = $2',
      [status, req.params.id]
    )

    res.json({ updated: true })
  } catch (err) {
    console.error('PATCH /reports/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
