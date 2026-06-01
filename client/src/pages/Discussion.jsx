import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Layout from '../components/Layout'
import PaperHeader from '../components/PaperHeader'
import CommentThread from '../components/CommentThread'
import PaperSidebar from '../components/PaperSidebar'
import { getComments } from '../lib/api'
import styles from './Discussion.module.css'

/**
 * Discussion page — /d/:id
 *
 * Fetches paper metadata (including who started the discussion) and comments.
 * Comment sort is controlled here and passed to CommentThread.
 */
export default function Discussion() {
  const { id: discussionId } = useParams()

  const [paper, setPaper] = useState(null)
  const [meta, setMeta] = useState(null) // { started_by, discussion_created_at, custom_tags }
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
      const [paperRes, commentsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL}/discussions/${discussionId}/paper`, {
          credentials: 'include'
        }).then(r => r.json()),
        getComments(discussionId, cursor, commentSort)
      ])

      if (paperRes.error) { setError(paperRes.error); return }

      setPaper(paperRes.paper)
      setMeta({
        started_by: paperRes.started_by,
        discussion_created_at: paperRes.discussion_created_at,
        custom_tags: paperRes.custom_tags || []
      })

      if (reset) {
        setComments(commentsRes.comments)
      } else {
        setComments(prev => [...prev, ...commentsRes.comments])
      }
      setNextCursor(commentsRes.next_cursor)
    } catch {
      setError('Failed to load discussion')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextCursor) return
    await load(false, nextCursor)
  }

  if (loading) return <Layout><p className={styles.loading}>Loading...</p></Layout>
  if (error) return <Layout><p className={styles.error}>{error}</p></Layout>

  const sidebar = paper ? <PaperSidebar paper={paper} discussionId={discussionId} /> : null

  return (
    <Layout sidebar={sidebar}>
      {paper && (
        <PaperHeader
          paper={paper}
          startedBy={meta?.started_by}
          discussionCreatedAt={meta?.discussion_created_at}
          customTags={meta?.custom_tags}
        />
      )}
      <div className={styles.divider} />
      <CommentThread
        discussionId={discussionId}
        comments={comments}
        setComments={setComments}
        nextCursor={nextCursor}
        onLoadMore={loadMore}
        onSortChange={setCommentSort}
        currentSort={commentSort}
      />
    </Layout>
  )
}
