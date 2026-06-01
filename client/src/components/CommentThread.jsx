import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Comment from './Comment'
import styles from './CommentThread.module.css'

/**
 * CommentThread
 *
 * Renders the full comment section for a discussion:
 * - Comment count header
 * - Top-level comment input (logged in only)
 * - List of comments with nested replies
 * - Load more button for pagination
 *
 * State management for adding/editing/deleting comments is
 * handled here and passed down to Comment components.
 *
 * In E9 all API calls will be wired to real endpoints.
 */
export default function CommentThread({ discussionId, comments, setComments }) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Add a new top-level comment
  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    try {
      // In E9: POST /discussions/:id/comments
      const mockComment = {
        id: `mock-${Date.now()}`,
        user_id: user.id,
        username: user.username,
        body: newComment.trim(),
        parent_comment_id: null,
        depth: 0,
        created_at: new Date().toISOString(),
        is_verified_author: false,
        replies: [],
      }
      setComments(prev => [...prev, mockComment])
      setNewComment('')
    } finally {
      setSubmitting(false)
    }
  }

  // Insert a reply into the correct position in the tree
  function handleReplyPosted(parentId, reply) {
    function insertReply(comments) {
      return comments.map(c => {
        if (c.id === parentId) {
          return { ...c, replies: [...(c.replies || []), reply] }
        }
        if (c.replies?.length) {
          return { ...c, replies: insertReply(c.replies) }
        }
        return c
      })
    }
    setComments(prev => insertReply(prev))
  }

  // Update comment body in tree
  function handleEdited(commentId, newBody) {
    function updateBody(comments) {
      return comments.map(c => {
        if (c.id === commentId) return { ...c, body: newBody }
        if (c.replies?.length) return { ...c, replies: updateBody(c.replies) }
        return c
      })
    }
    setComments(prev => updateBody(prev))
  }

  // Remove comment from tree (also removes its replies via cascade)
  function handleDeleted(commentId) {
    function removeComment(comments) {
      return comments
        .filter(c => c.id !== commentId)
        .map(c => ({
          ...c,
          replies: c.replies ? removeComment(c.replies) : []
        }))
    }
    setComments(prev => removeComment(prev))
  }

  const totalCount = countAll(comments)

  return (
    <div className={styles.thread}>
      {/* Header */}
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {totalCount === 0
            ? 'No comments yet'
            : `${totalCount} comment${totalCount === 1 ? '' : 's'}`
          }
        </h2>
      </div>

      {/* New comment input */}
      {user ? (
        <form className={styles.newCommentForm} onSubmit={handleCommentSubmit}>
          <textarea
            className={styles.textarea}
            placeholder="Add a comment..."
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            rows={4}
          />
          <div className={styles.formFooter}>
            <span className={styles.commentingAs}>
              Commenting as <strong>{user.username}</strong>
            </span>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || !newComment.trim()}
            >
              {submitting ? 'Posting...' : 'Post comment'}
            </button>
          </div>
        </form>
      ) : (
        <div className={styles.anonPrompt}>
          <span>
            <button
              className={styles.signInLink}
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
            {' '}to join the discussion.
          </span>
        </div>
      )}

      {/* Comments */}
      <div className={styles.comments}>
        {comments.map(comment => (
          <Comment
            key={comment.id}
            comment={comment}
            discussionId={discussionId}
            onReplyPosted={handleReplyPosted}
            onEdited={handleEdited}
            onDeleted={handleDeleted}
            depth={0}
          />
        ))}
      </div>
    </div>
  )
}

// Count all comments including nested replies
function countAll(comments) {
  let count = 0
  for (const c of comments) {
    count += 1
    if (c.replies?.length) count += countAll(c.replies)
  }
  return count
}
