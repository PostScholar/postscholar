'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Comment from './Comment'
import SortDropdown from './SortDropdown'
import { postComment } from '@/lib/api'
import styles from './CommentThread.module.css'

/**
 * CommentThread
 *
 * Renders the full comment section for a discussion.
 * Supports sort options: oldest, newest, top (most replied).
 *
 * Props:
 *   discussionId  — UUID
 *   comments      — current comment tree
 *   setComments   — state setter
 *   nextCursor    — pagination cursor
 *   onLoadMore    — fetch next page callback
 *   onSortChange  — called when sort changes so Discussion page can refetch
 */

const COMMENT_SORT_OPTIONS = [
  { value: 'oldest', label: 'Oldest first' },
  { value: 'newest', label: 'Newest first' },
  { value: 'top',    label: 'Most replied' },
]

export default function CommentThread({
  discussionId,
  comments,
  setComments,
  nextCursor,
  onLoadMore,
  onSortChange,
  currentSort = 'oldest',
}) {
  const { user } = useAuth()
  const router = useRouter()

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

  function handleReplyPosted(parentId, reply) {
    function insertReply(comments) {
      return comments.map(c => {
        if (c.id === parentId) return { ...c, replies: [...(c.replies || []), reply] }
        if (c.replies?.length) return { ...c, replies: insertReply(c.replies) }
        return c
      })
    }
    setComments(prev => insertReply(prev))
  }

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

  function handleDeleted(commentId) {
    function removeComment(comments) {
      return comments
        .filter(c => c.id !== commentId)
        .map(c => ({ ...c, replies: c.replies ? removeComment(c.replies) : [] }))
    }
    setComments(prev => removeComment(prev))
  }

  const totalCount = countAll(comments)

  return (
    <div className={styles.thread}>
      {/* Header with sort */}
      <div className={styles.header}>
        <h2 className={styles.heading}>
          {totalCount === 0
            ? 'No comments yet'
            : `${totalCount} comment${totalCount === 1 ? '' : 's'}`
          }
        </h2>
        {totalCount > 0 && (
          <SortDropdown
            options={COMMENT_SORT_OPTIONS}
            value={currentSort}
            onChange={onSortChange}
          />
        )}
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
          <button className={styles.signInLink} onClick={() => router.push('/login')}>
            Sign in
          </button>
          {' '}to join the discussion.
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