const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

router.use('/me/connections', require('./connections'))

router.get('/suggested', optionalAuth, async (req, res) => {
  try {
    const currentUserId = req.user?.userId

    if (currentUserId) {
      const topicBased = await pool.query(
        `SELECT u.id, u.username, u.affiliation,
                MAX(c.created_at) AS last_active
         FROM users u
         JOIN comments c ON c.user_id = u.id
         JOIN discussions d ON d.id = c.discussion_id
         JOIN discussion_topics dt ON dt.discussion_id = d.id
         JOIN topics t ON t.id = dt.topic_id
         WHERE t.slug IN (
           SELECT topic FROM topic_follows WHERE user_id = $1
         )
         AND u.id != $1
         AND u.deleted_at IS NULL
         AND u.id NOT IN (
           SELECT following_id FROM follows WHERE follower_id = $1
         )
         GROUP BY u.id, u.username, u.affiliation
         ORDER BY last_active DESC
         LIMIT 10`,
        [currentUserId]
      )

      if (topicBased.rows.length > 0) {
        return res.json({
          users: topicBased.rows.map(u => ({ ...u, is_following: false }))
        })
      }
    }

    let query = `
      SELECT u.id, u.username, u.affiliation,
             (SELECT COUNT(*) FROM discussions WHERE created_by = u.id) AS discussion_count,
             (SELECT MAX(c.created_at) FROM comments c WHERE c.user_id = u.id) AS last_active
      FROM users u
    `

    const params = []
    if (currentUserId) {
      query += `
        WHERE u.id != $1
        AND u.deleted_at IS NULL
        AND u.id NOT IN (
          SELECT following_id FROM follows WHERE follower_id = $1
        )
      `
      params.push(currentUserId)
    } else {
      query += `
        WHERE u.deleted_at IS NULL
      `
    }

    query += `
      ORDER BY last_active DESC NULLS LAST, discussion_count DESC
      LIMIT 10
    `

    const result = await pool.query(query, params)

    res.json({
      users: result.rows.map(u => ({ ...u, is_following: false }))
    })
  } catch (err) {
    console.error('GET /users/suggested error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, profile_visibility, affiliation,
              location, website_url, twitter_handle, google_scholar_url,
              orcid_id, created_at
       FROM users WHERE id = $1`,
      [req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    res.json(result.rows[0])
  } catch (err) {
    console.error('GET /users/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/:username', optionalAuth, async (req, res) => {
  try {
    const { username } = req.params

    const userResult = await pool.query(
      `SELECT id, username, display_name, bio, avatar_url, profile_visibility, affiliation,
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

    const isOwnProfile = req.user?.userId === user.id
    const showActivity = visibility.activity || isOwnProfile

    const profile = {
      username: user.username,
      display_name: user.display_name,
      avatar_url: user.avatar_url,
      bio: visibility.bio || isOwnProfile ? user.bio : null,
      joined_date: visibility.joined_date || isOwnProfile ? user.created_at : null,
      affiliation: user.affiliation,
      location: user.location,
      website_url: user.website_url,
      twitter_handle: user.twitter_handle,
      google_scholar_url: user.google_scholar_url,
      orcid_id: user.orcid_id,
      activity_visible: visibility.activity,
      is_own_profile: isOwnProfile,
      discussions: [],
      comments: [],
    }

    if (showActivity) {
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
      display_name,
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
    if (display_name !== undefined) {
      const trimmed = display_name.trim()
      if (trimmed.length > 50) {
        return res.status(400).json({ error: 'Display name must be 50 characters or fewer' })
      }
      updates.push(`display_name = $${paramCount++}`)
      values.push(trimmed || null)
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
      RETURNING id, username, display_name, bio, avatar_url, profile_visibility, affiliation,
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

router.delete('/me', authenticateToken, async (req, res) => {
  try {
    const { password, confirmation } = req.body

    if (!confirmation || confirmation !== 'DELETE MY ACCOUNT') {
      return res.status(400).json({
        error: 'Confirmation phrase required',
        code: 'CONFIRMATION_REQUIRED'
      })
    }

    const userResult = await pool.query(
      'SELECT id, password_hash, google_id, github_id, orcid_id FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' })
    }

    const user = userResult.rows[0]

    if (user.password_hash) {
      if (!password) {
        return res.status(400).json({
          error: 'Password required for password-based accounts',
          code: 'PASSWORD_REQUIRED'
        })
      }

      const bcrypt = require('bcryptjs')
      const validPassword = await bcrypt.compare(password, user.password_hash)
      if (!validPassword) {
        return res.status(401).json({
          error: 'Incorrect password',
          code: 'INVALID_PASSWORD'
        })
      }
    } else if (!user.google_id && !user.github_id && !user.orcid_id) {
      return res.status(500).json({ error: 'Account has no valid authentication method' })
    }

    await pool.query(
      `UPDATE users SET
        email = NULL,
        display_name = NULL,
        password_hash = NULL,
        google_id = NULL,
        github_id = NULL,
        orcid_id = NULL,
        bio = NULL,
        avatar_url = NULL,
        affiliation = NULL,
        location = NULL,
        website_url = NULL,
        twitter_handle = NULL,
        google_scholar_url = NULL,
        username = $1,
        deleted_at = NOW()
      WHERE id = $2`,
      [`deleted_user_${user.id}`, user.id]
    )

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    })

    res.json({
      message: 'Account deleted successfully',
      deleted_at: new Date().toISOString()
    })
  } catch (err) {
    console.error('DELETE /users/me error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
