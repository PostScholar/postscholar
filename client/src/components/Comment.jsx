import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import AuthorBadge from './AuthorBadge'
import styles from './Comment.module.css'

/**
 * Comment
 *
 * Renders a single comment with:
 * - Username + author badge + timestamp
 * - Body text
 * - Reply button (prompts login if not authenticated)
 * - Edit/delete for own comments
 * - Nested replies indented below
 *
 * Props:
 *   comment       — comment object with replies array
 *   discussionId  — for posting replies
 *   onReplyPosted — callback to update comment tree
 *   onEdited      — callback when comment body is updated
 *   onDeleted     — callback when comment is deleted
 *   depth         — current nesting depth (for indent)
 */

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function Comment({
  comment,
  discussionId,
  onReplyPosted,
  onEdited,
  onDeleted,
  depth = 0,
}) {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)

  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [editLoading, setEditLoading] = useState(false)

  const isOwn = user && user.id === comment.user_id

  // Indent capped visually at depth 6 to avoid extreme nesting
  const indentLevel = Math.min(depth, 6)

  function handleReplyClick() {
    if (!user) {
      navigate('/login')
      return
    }
    setReplyOpen(o => !o)
  }

  async function handleReplySubmit(e) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setReplyLoading(true)
    try {
      // In E9 this will call POST /discussions/:id/comments
      // For now we simulate with a mock reply
      const mockReply = {
        id: `mock-${Date.now()}`,
        user_id: user.id,
        username: user.username,
        body: replyBody.trim(),
        parent_comment_id: comment.id,
        depth: comment.depth + 1,
        created_at: new Date().toISOString(),
        is_verified_author: false,
        replies: [],
      }
      onReplyPosted(comment.id, mockReply)
      setReplyBody('')
      setReplyOpen(false)
    } finally {
      setReplyLoading(false)
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editBody.trim()) return
    setEditLoading(true)
    try {
      // In E9 this will call PATCH /discussions/comments/:id
      onEdited(comment.id, editBody.trim())
      setEditing(false)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment?')) return
    // In E9 this will call DELETE /discussions/comments/:id
    onDeleted(comment.id)
  }

  return (
    <div className={styles.comment} style={{ '--indent': indentLevel }}>
      {/* Thread line for nested comments */}
      {depth > 0 && <div className={styles.threadLine} />}

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <span className={styles.username}>{comment.username}</span>
          <AuthorBadge isVerifiedAuthor={comment.is_verified_author} />
          <span className={styles.time}>{timeAgo(comment.created_at)}</span>
        </div>

        {/* Body or edit form */}
        {editing ? (
          <form className={styles.editForm} onSubmit={handleEditSubmit}>
            <textarea
              className={styles.textarea}
              value={editBody}
              onChange={e => setEditBody(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.editActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setEditing(false); setEditBody(comment.body) }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.saveBtn}
                disabled={editLoading}
              >
                {editLoading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <p className={styles.text}>{comment.body}</p>
        )}

        {/* Actions */}
        {!editing && (
          <div className={styles.actions}>
            <button className={styles.actionBtn} onClick={handleReplyClick}>
              Reply
            </button>
            {isOwn && (
              <>
                <button className={styles.actionBtn} onClick={() => setEditing(true)}>
                  Edit
                </button>
                <button className={`${styles.actionBtn} ${styles.deleteBtn}`} onClick={handleDelete}>
                  Delete
                </button>
              </>
            )}
          </div>
        )}

        {/* Reply input */}
        {replyOpen && (
          <form className={styles.replyForm} onSubmit={handleReplySubmit}>
            <textarea
              className={styles.textarea}
              placeholder="Write a reply..."
              value={replyBody}
              onChange={e => setReplyBody(e.target.value)}
              rows={3}
              autoFocus
            />
            <div className={styles.replyActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setReplyOpen(false); setReplyBody('') }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={replyLoading || !replyBody.trim()}
              >
                {replyLoading ? 'Posting...' : 'Post reply'}
              </button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className={styles.replies}>
            {comment.replies.map(reply => (
              <Comment
                key={reply.id}
                comment={reply}
                discussionId={discussionId}
                onReplyPosted={onReplyPosted}
                onEdited={onEdited}
                onDeleted={onDeleted}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
