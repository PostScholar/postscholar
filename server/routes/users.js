const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params

    const userResult = await pool.query(
      `SELECT id, username, bio, avatar_url, profile_visibility, created_at
       FROM users WHERE username = $1`,
      [username]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]
    const visibility = user.profile_visibility || { bio: true, joined_date: true, activity: true }

    const profile = {
      username: user.username,
      avatar_url: user.avatar_url,
      bio: visibility.bio ? user.bio : null,
      joined_date: visibility.joined_date ? user.created_at : null,
    }

    if (visibility.activity) {
      const discussionsResult = await pool.query(
        `SELECT d.id, p.title, p.authors_json, p.journal, p.year,
                COUNT(c.id)::int AS comment_count,
                d.created_at
         FROM discussions d
         JOIN papers p ON p.id = d.paper_id
         LEFT JOIN comments c ON c.discussion_id = d.id
         WHERE d.created_by = $1
         GROUP BY d.id, p.title, p.authors_json, p.journal, p.year, d.created_at
         ORDER BY d.created_at DESC
         LIMIT 20`,
        [user.id]
      )

      const commentsResult = await pool.query(
        `SELECT c.id, c.body, c.created_at,
                d.id AS discussion_id,
                p.title AS paper_title
         FROM comments c
         JOIN discussions d ON d.id = c.discussion_id
         JOIN papers p ON p.id = d.paper_id
         WHERE c.user_id = $1
         ORDER BY c.created_at DESC
         LIMIT 20`,
        [user.id]
      )

      profile.discussions = discussionsResult.rows
      profile.comments = commentsResult.rows
    }

    res.json({ profile })
  } catch (err) {
    console.error('GET /users/:username error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/me', authenticateToken, async (req, res) => {
  try {
    const { bio, profile_visibility } = req.body

    const result = await pool.query(
      `UPDATE users
       SET bio = COALESCE($1, bio),
           profile_visibility = COALESCE($2, profile_visibility)
       WHERE id = $3
       RETURNING id, username, bio, avatar_url, profile_visibility, created_at`,
      [
        bio !== undefined ? bio.trim() : null,
        profile_visibility ? JSON.stringify(profile_visibility) : null,
        req.user.userId
      ]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('PATCH /users/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
