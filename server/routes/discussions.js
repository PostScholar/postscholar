const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

/**
 * buildTree(comments, verifiedUserIds)
 *
 * Takes a flat array of comment rows and a Set of user_ids that are verified
 * authors for this discussion. Returns a nested tree where each comment has:
 *   - is_verified_author: true if the commenter is a verified author
 *   - replies: array of child comments (recursive, unlimited depth)
 */
function buildTree(comments, verifiedUserIds) {
  const map = {}
  const roots = []

  for (const comment of comments) {
    map[comment.id] = {
      ...comment,
      is_verified_author: verifiedUserIds.has(comment.user_id),
      replies: []
    }
  }

  for (const comment of comments) {
    if (comment.parent_comment_id === null) {
      roots.push(map[comment.id])
    } else if (map[comment.parent_comment_id]) {
      map[comment.parent_comment_id].replies.push(map[comment.id])
    }
  }

  return roots
}

/**
 * getVerifiedUserIds(discussion_id)
 *
 * Returns a Set of user_ids that have a verified author record for the given
 * discussion. Used to compute is_verified_author on comments without a
 * per-comment query or a complex JOIN on the recursive CTE.
 */
async function getVerifiedUserIds(discussion_id) {
  const result = await pool.query(
    'SELECT user_id FROM author_verifications WHERE discussion_id = $1',
    [discussion_id]
  )
  return new Set(result.rows.map(r => r.user_id))
}

// ---------------------------------------------------------------------------
// GET /discussions/:id/comments
// ---------------------------------------------------------------------------
// Public (optionalAuth). Returns a paginated list of top-level comments with
// all replies nested. Each comment includes is_verified_author flag.
//
// Cursor-based pagination on created_at. Page size: 20 top-level comments.
// All replies for the page are fetched via recursive CTE in one query.
// ---------------------------------------------------------------------------
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { id: discussion_id } = req.params
    const cursor = req.query.cursor || null
    const limit = 20

    // Confirm the discussion exists
    const discussionCheck = await pool.query(
      'SELECT id FROM discussions WHERE id = $1',
      [discussion_id]
    )
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Fetch one extra row to detect if a next page exists
    // Join users to get username for display
    const topLevelResult = await pool.query(
      `SELECT c.*, u.username FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.discussion_id = $1
         AND c.parent_comment_id IS NULL
         ${cursor ? 'AND c.created_at > $3' : ''}
       ORDER BY c.created_at ASC
       LIMIT $2`,
      cursor ? [discussion_id, limit + 1, cursor] : [discussion_id, limit + 1]
    )

    const topLevelRows = topLevelResult.rows
    const hasNextPage = topLevelRows.length > limit
    const pageRows = hasNextPage ? topLevelRows.slice(0, limit) : topLevelRows

    let tree = []

    if (pageRows.length > 0) {
      const topLevelIds = pageRows.map(r => r.id)

      // Fetch all descendants of this page's top-level comments recursively
      const descendantsResult = await pool.query(
        `WITH RECURSIVE descendants AS (
           SELECT c.*, u.username FROM comments c
           JOIN users u ON u.id = c.user_id
           WHERE c.parent_comment_id = ANY($1::uuid[])
           UNION ALL
           SELECT c.*, u.username FROM comments c
           JOIN users u ON u.id = c.user_id
           INNER JOIN descendants d ON c.parent_comment_id = d.id
         )
         SELECT * FROM descendants ORDER BY created_at ASC`,
        [topLevelIds]
      )

      // Fetch verified author user_ids for this discussion
      const verifiedUserIds = await getVerifiedUserIds(discussion_id)

      const allComments = [...pageRows, ...descendantsResult.rows]
      tree = buildTree(allComments, verifiedUserIds)
    }

    const nextCursor = hasNextPage ? pageRows[pageRows.length - 1].created_at : null

    return res.json({ comments: tree, next_cursor: nextCursor })
  } catch (err) {
    console.error('GET /discussions/:id/comments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /discussions/:id/comments/search
// ---------------------------------------------------------------------------
// Public (optionalAuth). Full-text keyword search across all comments in a
// discussion. Returns up to 100 flat results ordered by relevance rank.
// is_verified_author is included on each result.
// ---------------------------------------------------------------------------
router.get('/:id/comments/search', optionalAuth, async (req, res) => {
  try {
    const { id: discussion_id } = req.params
    const { q } = req.query

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
      return res.status(400).json({ error: 'q is required' })
    }

    const discussionCheck = await pool.query(
      'SELECT id FROM discussions WHERE id = $1',
      [discussion_id]
    )
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    const [searchResult, verifiedUserIds] = await Promise.all([
      // Full-text search using PostgreSQL tsvector/tsquery
      pool.query(
        `SELECT
           id,
           user_id,
           parent_comment_id,
           depth,
           body,
           created_at,
           ts_rank(to_tsvector('english', body), plainto_tsquery('english', $2)) AS rank
         FROM comments
         WHERE discussion_id = $1
           AND to_tsvector('english', body) @@ plainto_tsquery('english', $2)
         ORDER BY rank DESC
         LIMIT 100`,
        [discussion_id, q.trim()]
      ),
      // Fetch verified authors in parallel
      getVerifiedUserIds(discussion_id)
    ])

    const results = searchResult.rows.map(row => ({
      ...row,
      is_verified_author: verifiedUserIds.has(row.user_id)
    }))

    return res.json({ results })
  } catch (err) {
    console.error('GET /discussions/:id/comments/search error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// POST /discussions/:id/comments
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Creates a new comment or reply.
// Returns the comment with is_verified_author flag attached.
//
// Body params:
//   body              (string, required)
//   parent_comment_id (UUID, optional) — omit for top-level comment
//
// Depth is computed server-side as parent.depth + 1.
// ---------------------------------------------------------------------------
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id: discussion_id } = req.params
    const { body, parent_comment_id } = req.body

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'body is required' })
    }

    const discussionCheck = await pool.query(
      'SELECT id FROM discussions WHERE id = $1',
      [discussion_id]
    )
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    let depth = 0

    if (parent_comment_id) {
      const parentCheck = await pool.query(
        'SELECT id, depth FROM comments WHERE id = $1 AND discussion_id = $2',
        [parent_comment_id, discussion_id]
      )
      if (parentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Parent comment not found' })
      }
      depth = parentCheck.rows[0].depth + 1
    }

    const result = await pool.query(
      `INSERT INTO comments (discussion_id, user_id, parent_comment_id, body, depth)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *, (SELECT username FROM users WHERE id = $2) AS username`,
      [discussion_id, req.user.userId, parent_comment_id || null, body.trim(), depth]
    )

    const comment = result.rows[0]

    // Check if the commenter is a verified author for this discussion
    const verifiedCheck = await pool.query(
      'SELECT id FROM author_verifications WHERE user_id = $1 AND discussion_id = $2',
      [req.user.userId, discussion_id]
    )

    return res.status(201).json({
      comment: {
        ...comment,
        is_verified_author: verifiedCheck.rows.length > 0
      }
    })
  } catch (err) {
    console.error('POST /discussions/:id/comments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /discussions/comments/:id
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Edits the body of a comment.
// Only the comment's author can edit — enforced via user_id in WHERE clause.
// Returns 403 if not found or not the owner.
// ---------------------------------------------------------------------------
router.patch('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { body } = req.body

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'body is required' })
    }

    const result = await pool.query(
      `UPDATE comments SET body = $1
       WHERE id = $2 AND user_id = $3
       RETURNING *`,
      [body.trim(), id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not found or not authorized' })
    }

    return res.json({ comment: result.rows[0] })
  } catch (err) {
    console.error('PATCH /discussions/comments/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /discussions/comments/:id
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Deletes a comment.
// Only the comment's author can delete it.
// Cascades to all replies via ON DELETE CASCADE in the schema.
// ---------------------------------------------------------------------------
router.delete('/comments/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM comments WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not found or not authorized' })
    }

    return res.json({ deleted: true })
  } catch (err) {
    console.error('DELETE /discussions/comments/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// DELETE /discussions/:id
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Deletes an entire discussion.
// Only the discussion creator can delete it.
// Cascades to all comments via ON DELETE CASCADE in the schema.
// ---------------------------------------------------------------------------
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'DELETE FROM discussions WHERE id = $1 AND created_by = $2 RETURNING id',
      [id, req.user.userId]
    )

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Not found or not authorized' })
    }

    return res.json({ deleted: true })
  } catch (err) {
    console.error('DELETE /discussions/:id error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /discussions/:id/paper
// ---------------------------------------------------------------------------
// Public (optionalAuth). Returns the paper associated with a discussion.
// Used by the frontend Discussion page to get paper metadata from a
// discussion ID — since the URL only contains the discussion UUID.
// ---------------------------------------------------------------------------
router.get('/:id/paper', optionalAuth, async (req, res) => {
  try {
    const { id: discussion_id } = req.params

    const result = await pool.query(
      `SELECT p.* FROM papers p
       JOIN discussions d ON d.paper_id = p.id
       WHERE d.id = $1`,
      [discussion_id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    return res.json({ paper: result.rows[0] })
  } catch (err) {
    console.error('GET /discussions/:id/paper error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
