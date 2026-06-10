const express = require('express')
const router = express.Router()
const pool = require('../db')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim()
    const type = req.query.type || 'all'
    const topic = (req.query.topic || '').trim()
    const yearFrom = req.query.year_from ? parseInt(req.query.year_from, 10) : null
    const yearTo = req.query.year_to ? parseInt(req.query.year_to, 10) : null
    const sort = req.query.sort || 'recent'

    if (!q && !topic && !yearFrom && !yearTo) {
      return res.json({ results: [], users: [] })
    }

    if (type === 'users') {
      const users = await pool.query(
        `SELECT
           id,
           username,
           bio,
           affiliation,
           created_at,
           (SELECT COUNT(*) FROM discussions WHERE created_by = users.id) as discussion_count
         FROM users
         WHERE ($1 = '' OR username ILIKE $2 OR bio ILIKE $2 OR affiliation ILIKE $2)
         ORDER BY discussion_count DESC
         LIMIT 20`,
        [q, `%${q}%`]
      )
      return res.json({ users: users.rows, results: [] })
    }

    const discussionParams = []
    let paramCount = 1
    const conditions = []

    if (q) {
      conditions.push(`(
        to_tsvector('english', p.title) @@ plainto_tsquery('english', $${paramCount})
        OR p.authors_json::text ILIKE $${paramCount + 1}
        OR p.title ILIKE $${paramCount + 1}
        OR p.journal ILIKE $${paramCount + 1}
      )`)
      discussionParams.push(q, `%${q}%`)
      paramCount += 2
    }

    if (topic) {
      conditions.push(`EXISTS (
        SELECT 1 FROM discussion_topics dt2
        JOIN topics t2 ON t2.id = dt2.topic_id
        WHERE dt2.discussion_id = d.id AND t2.slug = $${paramCount}
      )`)
      discussionParams.push(topic)
      paramCount++
    }

    if (yearFrom) {
      conditions.push(`p.year >= $${paramCount}`)
      discussionParams.push(yearFrom)
      paramCount++
    }

    if (yearTo) {
      conditions.push(`p.year <= $${paramCount}`)
      discussionParams.push(yearTo)
      paramCount++
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

    let orderClause = 'ORDER BY latest_activity DESC'
    if (sort === 'oldest') {
      orderClause = 'ORDER BY d.created_at ASC'
    } else if (sort === 'most_comments') {
      orderClause = 'ORDER BY comment_count DESC, latest_activity DESC'
    }

    const discussionsQuery = `
      SELECT
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
       ${whereClause}
       GROUP BY d.id, p.doi, p.title, p.authors_json, p.journal, p.year, u.username
       ${orderClause}
       LIMIT 30`

    const usersPromise = type === 'all' && q
      ? pool.query(
          `SELECT
             id,
             username,
             bio,
             affiliation,
             created_at,
             (SELECT COUNT(*) FROM discussions WHERE created_by = users.id) as discussion_count
           FROM users
           WHERE username ILIKE $1 OR bio ILIKE $1 OR affiliation ILIKE $1
           ORDER BY discussion_count DESC
           LIMIT 10`,
          [`%${q}%`]
        )
      : Promise.resolve({ rows: [] })

    const [discussions, users] = await Promise.all([
      pool.query(discussionsQuery, discussionParams),
      usersPromise
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
