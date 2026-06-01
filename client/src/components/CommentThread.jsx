import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Comment from './Comment'
import { postComment } from '../lib/api'
import styles from './CommentThread.module.css'

/**
 * CommentThread
 *
 * Renders the full comment section for a discussion.
 * All API calls are wired to real endpoints.
 *
 * Props:
 *   discussionId  — UUID of the discussion
 *   comments      — current comment tree array
 *   setComments   — state setter for updating the tree
 *   nextCursor    — pagination cursor, null if no more pages
 *   onLoadMore    — callback to fetch next page
 */
export default function CommentThread({
  discussionId,
  comments,
  setComments,
  nextCursor,
  onLoadMore
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function handleCommentSubmit(e) {
    e.preventDefault()
    if (!newComment.trim()) return
    setSubmitting(true)
    setError('')
    try {
      const data = await postComment(discussionId, newComment.trim())
      setComments(prev => [...prev, { ...data.comment, replies: [] }])
      setNewComment('')
    } catch (err) {
      setError(err.message)
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

  // Update comment body in the tree
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

  // Remove comment and its replies from the tree
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
          {error && <p className={styles.error}>{error}</p>}
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

      {/* Load more */}
      {nextCursor && (
        <button className={styles.loadMoreBtn} onClick={onLoadMore}>
          Load more comments
        </button>
      )}
    </div>
  )
}

function countAll(comments) {
  let count = 0
  for (const c of comments) {
    count += 1
    if (c.replies?.length) count += countAll(c.replies)
  }
  return count
}
