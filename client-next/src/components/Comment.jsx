'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Flag, Plus } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import AuthorBadge from './AuthorBadge'
import {
  postComment,
  editComment,
  deleteComment,
  submitReport,
  toggleCommentReaction,
} from '@/lib/api'
import CommentBody from './CommentBody'
import styles from './Comment.module.css'
import 'katex/dist/katex.min.css'

function authorLabel(comment) {
  return comment.display_name || comment.username
}

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

  const [reportOpen, setReportOpen] = useState(false)
  const [reportReason, setReportReason] = useState('spam')
  const [reportDescription, setReportDescription] = useState('')
  const [reportLoading, setReportLoading] = useState(false)
  const [reportSuccess, setReportSuccess] = useState(false)

  const [reactionCount, setReactionCount] = useState(comment.reaction_count || 0)
  const [userReacted, setUserReacted] = useState(comment.user_reacted || false)
  const [reactionLoading, setReactionLoading] = useState(false)

  const [repliesCollapsed, setRepliesCollapsed] = useState(depth >= 1)
  const [isMobile, setIsMobile] = useState(false)

  const isOwn = user && user.username === comment.username
  const indentLevel = Math.min(depth, 4)
  const replyCount = comment.replies?.length || 0
  const collapseReplies = isMobile && depth >= 1 && replyCount > 0

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 600px)')
    const update = () => setIsMobile(mq.matches)
    update()
    mq.addEventListener('change', update)
    return () => mq.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    setReactionCount(comment.reaction_count || 0)
    setUserReacted(comment.user_reacted || false)
  }, [comment.reaction_count, comment.user_reacted])

  function handleReplyClick() {
    if (!user) {
      router.push('/login')
      return
    }
    setReplyOpen(open => {
      if (!open) {
        setReplyBody(prev => prev.trim() ? prev : `@${comment.username} `)
      }
      return !open
    })
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

  async function handleReaction() {
    if (!user) {
      router.push('/login')
      return
    }
    if (reactionLoading) return

    setReactionLoading(true)
    try {
      const data = await toggleCommentReaction(comment.id)
      setReactionCount(data.reaction_count)
      setUserReacted(data.reacted)
    } catch (err) {
      alert(err.message)
    } finally {
      setReactionLoading(false)
    }
  }

  async function handleReportSubmit(e) {
    e.preventDefault()
    if (!reportReason) return
    setReportLoading(true)
    try {
      await submitReport({
        comment_id: comment.id,
        discussion_id: discussionId,
        reason: reportReason,
        description: reportDescription.trim() || null
      })
      setReportSuccess(true)
      setTimeout(() => {
        setReportOpen(false)
        setReportSuccess(false)
        setReportReason('spam')
        setReportDescription('')
      }, 2000)
    } catch (err) {
      alert(err.message)
    } finally {
      setReportLoading(false)
    }
  }

  return (
    <div
      className={styles.comment}
      style={{ '--indent': indentLevel }}
      data-is-author={comment.is_verified_author || false}
    >
      {depth > 0 && <div className={styles.threadLine} />}

      <div className={styles.body}>
        {/* Header */}
        <div className={styles.header}>
          <Link href={`/u/${comment.username}`} className={styles.username}>
            {authorLabel(comment)}
          </Link>
          <AuthorBadge isVerifiedAuthor={comment.is_verified_author} />
          <span className={styles.time}>{timeAgo(comment.created_at)}</span>
          {comment.updated_at && comment.updated_at !== comment.created_at && (
            <span className={styles.edited}>(edited)</span>
          )}
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
            <p className={styles.latexHint}>Tip: Use $...$ for inline math, $$...$$ for block math</p>
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
          <CommentBody body={comment.body} />
        )}

        {/* Actions */}
        {!editing && (
          <div className={styles.actions}>
            <button
              type="button"
              className={`${styles.reactionBtn} ${userReacted ? styles.reactionActive : ''}`}
              onClick={handleReaction}
              disabled={reactionLoading}
              aria-label={userReacted ? 'Remove appreciation' : 'Appreciate comment'}
              title={user ? 'Appreciate this comment' : 'Sign in to appreciate'}
            >
              <Plus size={14} strokeWidth={2.5} />
              {reactionCount > 0 && (
                <span className={styles.reactionCount}>{reactionCount}</span>
              )}
            </button>
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
            {!isOwn && user && (
              <button
                className={styles.reportBtn}
                onClick={() => setReportOpen(!reportOpen)}
                aria-label="Report comment"
              >
                <Flag size={14} />
              </button>
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
            <p className={styles.latexHint}>
              Use @username to mention someone · $...$ for inline math, $$...$$ for block math
            </p>
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

        {/* Report form */}
        {reportOpen && (
          <form className={styles.reportForm} onSubmit={handleReportSubmit}>
            {reportSuccess ? (
              <p className={styles.reportSuccess}>Report submitted. Thank you.</p>
            ) : (
              <>
                <label className={styles.label}>
                  Reason
                  <select
                    className={styles.select}
                    value={reportReason}
                    onChange={e => setReportReason(e.target.value)}
                  >
                    <option value="spam">Spam</option>
                    <option value="harassment">Harassment</option>
                    <option value="offtopic">Off-topic</option>
                    <option value="misinformation">Misinformation</option>
                    <option value="other">Other</option>
                  </select>
                </label>
                <textarea
                  className={styles.textarea}
                  placeholder="Additional details (optional)"
                  value={reportDescription}
                  onChange={e => setReportDescription(e.target.value)}
                  rows={3}
                />
                <div className={styles.reportActions}>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => { setReportOpen(false); setReportReason('spam'); setReportDescription('') }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={styles.submitBtn}
                    disabled={reportLoading}
                  >
                    {reportLoading ? 'Submitting...' : 'Submit report'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {/* Nested replies */}
        {comment.replies?.length > 0 && (
          <div className={styles.replies}>
            {collapseReplies && repliesCollapsed && (
              <button
                type="button"
                className={styles.collapseToggle}
                onClick={() => setRepliesCollapsed(false)}
              >
                Show {replyCount} repl{replyCount === 1 ? 'y' : 'ies'}
              </button>
            )}
            {(!collapseReplies || !repliesCollapsed) &&
              comment.replies.map(reply => (
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
            {collapseReplies && !repliesCollapsed && (
              <button
                type="button"
                className={styles.collapseToggle}
                onClick={() => setRepliesCollapsed(true)}
              >
                Hide replies
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}