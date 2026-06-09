const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

router.get('/', authenticateToken, async (req, res) => {
  try {
    const { unread_only = 'false' } = req.query

    let query = `
      SELECT
        m.id,
        m.comment_id,
        m.created_at,
        m.read,
        c.body as comment_body,
        u.username as mentioning_username,
        d.id as discussion_id,
        p.title as discussion_title
      FROM mentions m
      JOIN comments c ON m.comment_id = c.id
      JOIN users u ON m.mentioning_user_id = u.id
      JOIN discussions d ON c.discussion_id = d.id
      JOIN papers p ON p.id = d.paper_id
      WHERE m.mentioned_user_id = $1
    `

    if (unread_only === 'true') {
      query += ' AND m.read = false'
    }

    query += ' ORDER BY m.created_at DESC LIMIT 50'

    const result = await pool.query(query, [req.user.userId])

    res.json({ mentions: result.rows })
  } catch (err) {
    console.error('GET /mentions error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/mark-all-read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE mentions SET read = true WHERE mentioned_user_id = $1 AND read = false',
      [req.user.userId]
    )
    res.json({ updated: true })
  } catch (err) {
    console.error('PATCH /mentions/mark-all-read error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/unread-count', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM mentions WHERE mentioned_user_id = $1 AND read = false',
      [req.user.userId]
    )
    res.json({ count: parseInt(result.rows[0].count) })
  } catch (err) {
    console.error('GET /mentions/unread-count error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id/read', authenticateToken, async (req, res) => {
  try {
    await pool.query(
      'UPDATE mentions SET read = true WHERE id = $1 AND mentioned_user_id = $2',
      [req.params.id, req.user.userId]
    )
    res.json({ updated: true })
  } catch (err) {
    console.error('PATCH /mentions/:id/read error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
