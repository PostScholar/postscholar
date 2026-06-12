const express = require('express')
const router = express.Router()
const pool = require('../db')

// GET /sitemap/discussions
// Lightweight list for Next.js sitemap generation.
router.get('/sitemap/discussions', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT
         d.id,
         p.title,
         d.created_at,
         COALESCE(
           (SELECT MAX(c.created_at) FROM comments c WHERE c.discussion_id = d.id),
           d.created_at
         ) AS last_modified
       FROM discussions d
       JOIN papers p ON p.id = d.paper_id
       ORDER BY last_modified DESC`
    )

    return res.json({ discussions: result.rows })
  } catch (err) {
    console.error('GET /sitemap/discussions error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
