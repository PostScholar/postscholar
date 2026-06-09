const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params

    const userResult = await pool.query(
      `SELECT id, username, bio, avatar_url, profile_visibility, affiliation,
              location, website_url, twitter_handle, google_scholar_url,
              orcid_id, created_at
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
      affiliation: user.affiliation,
      location: user.location,
      website_url: user.website_url,
      twitter_handle: user.twitter_handle,
      google_scholar_url: user.google_scholar_url,
      orcid_id: user.orcid_id,
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
    const {
      bio,
      profile_visibility,
      affiliation,
      location,
      website_url,
      twitter_handle,
      google_scholar_url
    } = req.body

    // Build dynamic update query
    const updates = []
    const values = []
    let paramCount = 1

    if (bio !== undefined) {
      updates.push(`bio = $${paramCount++}`)
      values.push(bio.trim())
    }
    if (profile_visibility !== undefined) {
      updates.push(`profile_visibility = $${paramCount++}`)
      values.push(JSON.stringify(profile_visibility))
    }
    if (affiliation !== undefined) {
      updates.push(`affiliation = $${paramCount++}`)
      values.push(affiliation.trim() || null)
    }
    if (location !== undefined) {
      updates.push(`location = $${paramCount++}`)
      values.push(location.trim() || null)
    }
    if (website_url !== undefined) {
      updates.push(`website_url = $${paramCount++}`)
      values.push(website_url.trim() || null)
    }
    if (twitter_handle !== undefined) {
      // Strip @ if present
      const handle = twitter_handle.trim().replace(/^@/, '') || null
      updates.push(`twitter_handle = $${paramCount++}`)
      values.push(handle)
    }
    if (google_scholar_url !== undefined) {
      updates.push(`google_scholar_url = $${paramCount++}`)
      values.push(google_scholar_url.trim() || null)
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    values.push(req.user.userId)
    const query = `
      UPDATE users
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, username, bio, avatar_url, profile_visibility, affiliation,
                location, website_url, twitter_handle, google_scholar_url,
                orcid_id, created_at
    `

    const result = await pool.query(query, values)

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
