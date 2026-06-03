'use client'

import { useState, useEffect } from 'react'
import CommentThread from '@/components/CommentThread'
import { getComments } from '@/lib/api'
import styles from './Discussion.module.css'

export default function DiscussionComments({ discussionId }) {
  const [comments, setComments] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentSort, setCommentSort] = useState('oldest')

  useEffect(() => {
    load(true)
  }, [discussionId, commentSort])

  async function load(reset = false, cursor = null) {
    if (reset) setLoading(true)
    setError('')
    try {
      const commentsRes = await getComments(discussionId, cursor, commentSort)

      if (reset) {
        setComments(commentsRes.comments)
      } else {
        setComments(prev => [...prev, ...commentsRes.comments])
      }
      setNextCursor(commentsRes.next_cursor)
    } catch (err) {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextCursor) return
    await load(false, nextCursor)
  }

  if (loading) return <p className={styles.loading}>Loading comments...</p>
  if (error) return <p className={styles.error}>{error}</p>

  return (
    <CommentThread
      discussionId={discussionId}
      comments={comments}
      setComments={setComments}
      nextCursor={nextCursor}
      onLoadMore={loadMore}
      onSortChange={setCommentSort}
      currentSort={commentSort}
    />
  )
}