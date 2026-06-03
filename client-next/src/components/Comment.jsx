'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import AuthorBadge from './AuthorBadge'
import { postComment, editComment, deleteComment } from '@/lib/api'
import styles from './Comment.module.css'

/**
 * Comment
 *
 * Renders a single comment with nested replies.
 * All mutations (reply, edit, delete) are wired to real API endpoints.
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
  const router = useRouter()

  const [replyOpen, setReplyOpen] = useState(false)
  const [replyBody, setReplyBody] = useState('')
  const [replyLoading, setReplyLoading] = useState(false)
  const [replyError, setReplyError] = useState('')

  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const isOwn = user && user.userId === comment.user_id
  const indentLevel = Math.min(depth, 6)

  function handleReplyClick() {
    if (!user) {
      router.push('/login')
      return
    }
    setReplyOpen(o => !o)
  }

  async function handleReplySubmit(e) {
    e.preventDefault()
    if (!replyBody.trim()) return
    setReplyLoading(true)
    setReplyError('')
    try {
      const data = await postComment(discussionId, replyBody.trim(), comment.id)
      onReplyPosted(comment.id, { ...data.comment, replies: [] })
      setReplyBody('')
      setReplyOpen(false)
    } catch (err) {
      setReplyError(err.message)
    } finally {
      setReplyLoading(false)
    }
  }

  async function handleEditSubmit(e) {
    e.preventDefault()
    if (!editBody.trim()) return
    setEditLoading(true)
    setEditError('')
    try {
      const data = await editComment(comment.id, editBody.trim())
      onEdited(comment.id, data.comment.body)
      setEditing(false)
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this comment and all its replies?')) return
    try {
      await deleteComment(comment.id)
      onDeleted(comment.id)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className={styles.comment} style={{ '--indent': indentLevel }}>
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
            {editError && <p className={styles.formError}>{editError}</p>}
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
                <button
                  className={`${styles.actionBtn} ${styles.deleteBtn}`}
                  onClick={handleDelete}
                >
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
            {replyError && <p className={styles.formError}>{replyError}</p>}
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