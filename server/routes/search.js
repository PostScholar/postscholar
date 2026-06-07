const express = require('express')
const router = express.Router()
const pool = require('../db')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    if (!q) return res.json({ results: [] })

    const result = await pool.query(
      `SELECT
         d.id,
         d.created_at,
         d.custom_tags,
         p.doi,
         p.title,
         p.authors_json,
         p.journal,
         p.year,
         COUNT(c.id)::int AS comment_count,
         MAX(COALESCE(c.created_at, d.created_at)) AS latest_activity
       FROM discussions d
       JOIN papers p ON p.id = d.paper_id
       LEFT JOIN comments c ON c.discussion_id = d.id
       WHERE
         to_tsvector('english', p.title) @@ plainto_tsquery('english', $1)
         OR p.authors_json::text ILIKE $2
       GROUP BY d.id, p.doi, p.title, p.authors_json, p.journal, p.year
       ORDER BY latest_activity DESC
       LIMIT 30`,
      [q, `%${q}%`]
    )

    res.json({ results: result.rows })
  } catch (err) {
    console.error('GET /search error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
