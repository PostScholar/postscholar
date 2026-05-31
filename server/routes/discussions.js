const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

/**
 * buildTree(comments)
 *
 * Takes a flat array of comment rows from the database and converts it
 * into a nested tree structure where each top-level comment has a
 * `replies` array containing its direct children, and each child
 * recursively contains its own `replies` array.
 *
 * This is done in JavaScript rather than SQL because recursive SQL
 * queries return flat results anyway and JS tree-building is simpler
 * to read and maintain.
 */
function buildTree(comments) {
  const map = {}   // id -> comment node with empty replies array
  const roots = [] // top-level comments (no parent)

  // First pass: index every comment by id
  for (const comment of comments) {
    map[comment.id] = { ...comment, replies: [] }
  }

  // Second pass: attach each comment to its parent or to roots
  for (const comment of comments) {
    if (comment.parent_comment_id === null) {
      roots.push(map[comment.id])
    } else if (map[comment.parent_comment_id]) {
      map[comment.parent_comment_id].replies.push(map[comment.id])
    }
  }

  return roots
}

// ---------------------------------------------------------------------------
// GET /discussions/:id/comments
// ---------------------------------------------------------------------------
// Public (optionalAuth). Returns a paginated list of top-level comments for
// a discussion, each with its full reply tree nested inside.
//
// Pagination is cursor-based using created_at. Pass ?cursor=<timestamp> to
// get the next page. Page size is 20 top-level comments. All replies for
// those 20 comments are fetched in a single recursive CTE query and attached.
// ---------------------------------------------------------------------------
router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { id: discussion_id } = req.params
    const cursor = req.query.cursor || null
    const limit = 20

    // Confirm the discussion exists before querying comments
    const discussionCheck = await pool.query(
      'SELECT id FROM discussions WHERE id = $1',
      [discussion_id]
    )
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Fetch one extra row beyond the limit to detect if a next page exists
    const topLevelResult = await pool.query(
      `SELECT * FROM comments
       WHERE discussion_id = $1
         AND parent_comment_id IS NULL
         ${cursor ? 'AND created_at > $3' : ''}
       ORDER BY created_at ASC
       LIMIT $2`,
      cursor ? [discussion_id, limit + 1, cursor] : [discussion_id, limit + 1]
    )

    const topLevelRows = topLevelResult.rows
    const hasNextPage = topLevelRows.length > limit
    // Trim the extra row — it was only used to check for next page
    const pageRows = hasNextPage ? topLevelRows.slice(0, limit) : topLevelRows

    let tree = []

    if (pageRows.length > 0) {
      const topLevelIds = pageRows.map(r => r.id)

      // Use a recursive CTE to fetch all descendants of the current page's
      // top-level comments in a single query, no matter how deep the thread is
      const descendantsResult = await pool.query(
        `WITH RECURSIVE descendants AS (
           -- Base case: direct children of top-level comments on this page
           SELECT * FROM comments
           WHERE parent_comment_id = ANY($1::uuid[])
           UNION ALL
           -- Recursive case: children of children, indefinitely
           SELECT c.* FROM comments c
           INNER JOIN descendants d ON c.parent_comment_id = d.id
         )
         SELECT * FROM descendants ORDER BY created_at ASC`,
        [topLevelIds]
      )

      // Combine top-level rows and all their descendants, then build the tree
      const allComments = [
        ...pageRows,
        ...descendantsResult.rows
      ]

      tree = buildTree(allComments)
    }

    // Return the created_at of the last top-level comment as the next cursor
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
// discussion. Uses PostgreSQL's built-in tsvector/tsquery for relevance
// ranking. Returns up to 100 flat results ordered by rank descending.
// Results are flat (not nested) — the frontend highlights matches in context.
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

    // plainto_tsquery converts plain text input (e.g. "machine learning")
    // into a tsquery without requiring the user to know tsquery syntax.
    // ts_rank scores how well the document matches the query.
    const result = await pool.query(
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
    )

    return res.json({ results: result.rows })
  } catch (err) {
    console.error('GET /discussions/:id/comments/search error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// POST /discussions/:id/comments
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Creates a new comment or reply.
//
// Body params:
//   body              (string, required) — comment text
//   parent_comment_id (UUID, optional)  — omit for top-level comment;
//                                         provide to reply to any comment
//
// Depth is computed server-side: parent.depth + 1. This means nesting is
// unlimited — the client controls how deep threads visually render.
// ---------------------------------------------------------------------------
router.post('/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id: discussion_id } = req.params
    const { body, parent_comment_id } = req.body

    if (!body || typeof body !== 'string' || body.trim().length === 0) {
      return res.status(400).json({ error: 'body is required' })
    }

    // Confirm the discussion exists
    const discussionCheck = await pool.query(
      'SELECT id FROM discussions WHERE id = $1',
      [discussion_id]
    )
    if (discussionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Discussion not found' })
    }

    // Default depth is 0 (top-level). If replying, inherit parent's depth + 1.
    let depth = 0

    if (parent_comment_id) {
      // Verify the parent comment exists and belongs to this discussion
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
       RETURNING *`,
      [discussion_id, req.user.userId, parent_comment_id || null, body.trim(), depth]
    )

    return res.status(201).json({ comment: result.rows[0] })
  } catch (err) {
    console.error('POST /discussions/:id/comments error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// PATCH /discussions/comments/:id
// ---------------------------------------------------------------------------
// Protected (authenticateToken). Edits the body of a comment.
// Only the comment's author can edit it — enforced by checking user_id in
// the WHERE clause. If no rows are updated, we return 403 (not found or
// not the owner) rather than leaking which case it is.
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
// Only the comment's author can delete it. Deleting a parent comment will
// cascade-delete all its replies (enforced by ON DELETE CASCADE in the schema).
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
// Only the user who created the discussion can delete it. Deleting a
// discussion cascades to all its comments (ON DELETE CASCADE in schema).
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

module.exports = router
