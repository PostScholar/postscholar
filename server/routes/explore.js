const express = require('express')
const router = express.Router()
const pool = require('../db')
const optionalAuth = require('../middleware/optionalAuth')

// ---------------------------------------------------------------------------
// GET /topics
// ---------------------------------------------------------------------------
// Public. Returns the full topic taxonomy — top-level topics each with their
// sub-topics nested in a children array.
// ---------------------------------------------------------------------------
router.get('/topics', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, slug, parent_id FROM topics ORDER BY name ASC`
    )

    const all = result.rows
    const map = {}
    const roots = []

    for (const topic of all) {
      map[topic.id] = { ...topic, children: [] }
    }

    for (const topic of all) {
      if (topic.parent_id === null) {
        roots.push(map[topic.id])
      } else if (map[topic.parent_id]) {
        map[topic.parent_id].children.push(map[topic.id])
      }
    }

    return res.json({ topics: roots })
  } catch (err) {
    console.error('GET /topics error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /explore/active
// ---------------------------------------------------------------------------
// Public. Returns recently active discussions (at least one comment).
// Used for the Explore "Recently active" spotlight section.
// ---------------------------------------------------------------------------
router.get('/explore/active', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 6, 12)

    const result = await pool.query(
      `SELECT
         d.id,
         d.created_at,
         p.title,
         p.authors_json,
         p.journal,
         p.year,
         u.username,
         u.display_name,
         (
           SELECT COUNT(*)
           FROM comments c
           WHERE c.discussion_id = d.id
         )::int AS comment_count,
         (
           SELECT MAX(c.created_at)
           FROM comments c
           WHERE c.discussion_id = d.id
         ) AS latest_activity,
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
       WHERE EXISTS (
         SELECT 1 FROM comments c WHERE c.discussion_id = d.id
       )
       ORDER BY latest_activity DESC
       LIMIT $1`,
      [limit]
    )

    return res.json({ discussions: result.rows })
  } catch (err) {
    console.error('GET /explore/active error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /explore
// ---------------------------------------------------------------------------
// Public (optionalAuth). Returns paginated discussions ordered by the chosen
// sort option.
//
// Query params:
//   topic=slug          filter by topic slug (top-level includes sub-topics)
//   filter=all|unanswered|new
//   sort=recent|new|oldest|pub_date_desc|pub_date_asc
//     recent       — latest activity (default)
//     new          — discussion start date, newest first
//     oldest       — discussion start date, oldest first
//     pub_date_desc — paper publication year, newest first
//     pub_date_asc  — paper publication year, oldest first
//   cursor=value    pagination cursor (value depends on sort field)
// ---------------------------------------------------------------------------
router.get('/explore', optionalAuth, async (req, res) => {
  try {
    const { topic, filter, sort = 'recent', cursor } = req.query
    const limit = 20

    const conditions = []
    const params = []
    let paramIndex = 1

    // Topic filter
    if (topic) {
      const topicResult = await pool.query(
        'SELECT id, parent_id FROM topics WHERE slug = $1',
        [topic]
      )
      if (topicResult.rows.length > 0) {
        const t = topicResult.rows[0]
        if (t.parent_id === null) {
          // Top-level: include all children too
          const childResult = await pool.query(
            'SELECT id FROM topics WHERE parent_id = $1',
            [t.id]
          )
          const topicIds = [t.id, ...childResult.rows.map(r => r.id)]
          params.push(topicIds)
          conditions.push(
            `d.id IN (
              SELECT discussion_id FROM discussion_topics
              WHERE topic_id = ANY($${paramIndex}::uuid[])
            )`
          )
          paramIndex++
        } else {
          params.push(t.id)
          conditions.push(
            `d.id IN (
              SELECT discussion_id FROM discussion_topics
              WHERE topic_id = $${paramIndex}
            )`
          )
          paramIndex++
        }
      }
    }

    // Filter: unanswered or new
    if (filter === 'unanswered') {
      conditions.push(
        `(SELECT COUNT(*) FROM comments c WHERE c.discussion_id = d.id) = 0`
      )
    } else if (filter === 'new') {
      conditions.push(`d.created_at > NOW() - INTERVAL '7 days'`)
    }

    // Determine sort column and cursor field
    // Cursor pagination uses different fields depending on sort
    let orderClause
    let cursorField
    let cursorCast

    switch (sort) {
      case 'new':
        orderClause = 'ORDER BY d.created_at DESC'
        cursorField = 'd.created_at'
        cursorCast = '::timestamptz'
        break
      case 'oldest':
        orderClause = 'ORDER BY d.created_at ASC'
        cursorField = 'd.created_at'
        cursorCast = '::timestamptz'
        break
      case 'pub_date_desc':
        orderClause = 'ORDER BY p.year DESC NULLS LAST, d.created_at DESC'
        cursorField = 'p.year'
        cursorCast = '::int'
        break
      case 'pub_date_asc':
        orderClause = 'ORDER BY p.year ASC NULLS LAST, d.created_at ASC'
        cursorField = 'p.year'
        cursorCast = '::int'
        break
      case 'recent':
      default:
        orderClause = 'ORDER BY latest_activity DESC'
        cursorField = 'latest_activity'
        cursorCast = '::timestamptz'
        break
    }

    // Cursor condition — use < for DESC sorts, > for ASC sorts
    if (cursor) {
      params.push(cursor)
      const isAsc = sort === 'oldest' || sort === 'pub_date_asc'
      const op = isAsc ? '>' : '<'

      if (sort === 'pub_date_desc' || sort === 'pub_date_asc') {
        // Year-based cursor — also need secondary sort tie-breaking
        conditions.push(`p.year ${op} $${paramIndex}${cursorCast}`)
      } else {
        conditions.push(`${cursorField} ${op} $${paramIndex}${cursorCast}`)
      }
      paramIndex++
    }

    const whereClause = conditions.length > 0
      ? 'WHERE ' + conditions.join(' AND ')
      : ''

    params.push(limit + 1)
    const limitParam = `$${paramIndex}`

    const result = await pool.query(
      `SELECT
         d.id,
         d.created_at,
         d.custom_tags,
         p.id          AS paper_id,
         p.doi,
         p.title,
         p.authors_json,
         p.journal,
         p.year,
         u.username,
         u.display_name,
         (
           SELECT COUNT(*)
           FROM comments c
           WHERE c.discussion_id = d.id
         )::int AS comment_count,
         COALESCE(
           (SELECT MAX(c.created_at) FROM comments c WHERE c.discussion_id = d.id),
           d.created_at
         ) AS latest_activity,
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
       ${whereClause}
       ${orderClause}
       LIMIT ${limitParam}`,
      params
    )

    const rows = result.rows
    const hasNextPage = rows.length > limit
    const pageRows = hasNextPage ? rows.slice(0, limit) : rows

    // Next cursor value depends on sort field
    let nextCursor = null
    if (hasNextPage) {
      const last = pageRows[pageRows.length - 1]
      switch (sort) {
        case 'new':
        case 'oldest':
          nextCursor = last.created_at
          break
        case 'pub_date_desc':
        case 'pub_date_asc':
          nextCursor = last.year
          break
        default:
          nextCursor = last.latest_activity
      }
    }

    return res.json({ discussions: pageRows, next_cursor: nextCursor })
  } catch (err) {
    console.error('GET /explore error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
