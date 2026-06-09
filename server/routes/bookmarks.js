const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/', authenticateToken, async (req, res) => {
  const { discussionId } = req.body
  const userId = req.user.userId

  if (!discussionId) {
    return res.status(400).json({ error: 'discussion_id required' })
  }

  try {
    await pool.query(
      'INSERT INTO bookmarks (user_id, discussion_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [userId, discussionId]
    )
    res.json({ bookmarked: true })
  } catch (error) {
    console.error('Error creating bookmark:', error)
    res.status(500).json({ error: 'Failed to bookmark discussion' })
  }
})

router.delete('/:discussionId', authenticateToken, async (req, res) => {
  const { discussionId } = req.params
  const userId = req.user.userId

  try {
    await pool.query(
      'DELETE FROM bookmarks WHERE user_id = $1 AND discussion_id = $2',
      [userId, discussionId]
    )
    res.json({ bookmarked: false })
  } catch (error) {
    console.error('Error deleting bookmark:', error)
    res.status(500).json({ error: 'Failed to unbookmark discussion' })
  }
})

router.get('/', authenticateToken, async (req, res) => {
  const userId = req.user.userId

  try {
    const result = await pool.query(
      `SELECT
        d.id,
        d.created_at as discussion_created_at,
        p.id as paper_id,
        p.title,
        p.authors_json,
        p.journal,
        p.year,
        p.doi,
        u.username as started_by,
        COUNT(c.id)::int as comment_count,
        b.created_at as bookmarked_at
      FROM bookmarks b
      JOIN discussions d ON b.discussion_id = d.id
      JOIN papers p ON d.paper_id = p.id
      LEFT JOIN users u ON d.created_by = u.id
      LEFT JOIN comments c ON d.id = c.discussion_id
      WHERE b.user_id = $1
      GROUP BY d.id, p.id, u.username, b.created_at
      ORDER BY b.created_at DESC`,
      [userId]
    )

    res.json({ bookmarks: result.rows })
  } catch (error) {
    console.error('Error fetching bookmarks:', error)
    res.status(500).json({ error: 'Failed to fetch bookmarks' })
  }
})

router.get('/check/:discussionId', authenticateToken, async (req, res) => {
  const { discussionId } = req.params
  const userId = req.user.userId

  try {
    const result = await pool.query(
      'SELECT id FROM bookmarks WHERE user_id = $1 AND discussion_id = $2',
      [userId, discussionId]
    )
    res.json({ bookmarked: result.rows.length > 0 })
  } catch (error) {
    console.error('Error checking bookmark:', error)
    res.status(500).json({ error: 'Failed to check bookmark status' })
  }
})

module.exports = router
