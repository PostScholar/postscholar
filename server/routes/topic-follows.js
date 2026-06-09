const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

router.post('/', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' })
    }

    await pool.query(
      `INSERT INTO topic_follows (user_id, topic)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [req.user.userId, topic.toLowerCase().trim()]
    )

    res.json({ following: true })
  } catch (err) {
    console.error('POST /topic-follows error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.body

    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic is required' })
    }

    await pool.query(
      'DELETE FROM topic_follows WHERE user_id = $1 AND topic = $2',
      [req.user.userId, topic.toLowerCase().trim()]
    )

    res.json({ following: false })
  } catch (err) {
    console.error('DELETE /topic-follows error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT topic, created_at FROM topic_follows WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    )

    res.json({ topics: result.rows })
  } catch (err) {
    console.error('GET /topic-follows error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/check', authenticateToken, async (req, res) => {
  try {
    const { topic } = req.query

    if (!topic) {
      return res.status(400).json({ error: 'Topic query param required' })
    }

    const result = await pool.query(
      'SELECT 1 FROM topic_follows WHERE user_id = $1 AND topic = $2',
      [req.user.userId, topic.toLowerCase().trim()]
    )

    res.json({ following: result.rows.length > 0 })
  } catch (err) {
    console.error('GET /topic-follows/check error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
