const express = require('express')
const router = express.Router()
const pool = require('../db')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    const type = req.query.type || 'all'

    if (!q) return res.json({ results: [], users: [] })

    if (type === 'users') {
      const users = await pool.query(
        `SELECT
           id,
           username,
           bio,
           affiliation,
           created_at,
           (SELECT COUNT(*) FROM discussions WHERE created_by = users.id) as discussion_count,
           (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as follower_count
         FROM users
         WHERE username ILIKE $1
            OR bio ILIKE $1
            OR affiliation ILIKE $1
         ORDER BY follower_count DESC, discussion_count DESC
         LIMIT 20`,
        [`%${q}%`]
      )
      return res.json({ users: users.rows, results: [] })
    }

    const [discussions, users] = await Promise.all([
      pool.query(
        `SELECT
           d.id,
           d.created_at,
           d.custom_tags,
           p.doi,
           p.title,
           p.authors_json,
           p.journal,
           p.year,
           u.username,
           COUNT(c.id)::int AS comment_count,
           MAX(COALESCE(c.created_at, d.created_at)) AS latest_activity,
           COALESCE(
             (
               SELECT json_agg(json_build_object('name', t.name, 'slug', t.slug))
               FROM discussion_topics dt
               JOIN topics t ON t.id = dt.topic_id
               WHERE dt.discussion_id = d.id
             ),
             '[]'::json
           ) AS topics
         FROM discussions d
         JOIN papers p ON p.id = d.paper_id
         LEFT JOIN users u ON u.id = d.created_by
         LEFT JOIN comments c ON c.discussion_id = d.id
         WHERE
           to_tsvector('english', p.title) @@ plainto_tsquery('english', $1)
           OR p.authors_json::text ILIKE $2
           OR p.title ILIKE $2
           OR p.journal ILIKE $2
         GROUP BY d.id, p.doi, p.title, p.authors_json, p.journal, p.year, u.username
         ORDER BY latest_activity DESC
         LIMIT 30`,
        [q, `%${q}%`]
      ),
      type === 'all' ? pool.query(
        `SELECT
           id,
           username,
           bio,
           affiliation,
           created_at,
           (SELECT COUNT(*) FROM discussions WHERE created_by = users.id) as discussion_count,
           (SELECT COUNT(*) FROM follows WHERE following_id = users.id) as follower_count
         FROM users
         WHERE username ILIKE $1
            OR bio ILIKE $1
            OR affiliation ILIKE $1
         ORDER BY follower_count DESC, discussion_count DESC
         LIMIT 10`,
        [`%${q}%`]
      ) : { rows: [] }
    ])

    res.json({
      results: discussions.rows,
      users: users.rows
    })
  } catch (err) {
    console.error('GET /search error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
