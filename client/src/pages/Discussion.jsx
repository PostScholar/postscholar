import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import PaperHeader from '../components/PaperHeader'
import CommentThread from '../components/CommentThread'
import PaperSidebar from '../components/PaperSidebar'
import { getPaperByDoi, getComments } from '../lib/api'
import styles from './Discussion.module.css'

/**
 * Discussion page — /d/:id
 *
 * The :id param is the discussion UUID. We need both the paper
 * and the comments. The paper is fetched via the discussion's
 * paper DOI — but we only have the discussion ID here.
 *
 * Strategy: fetch comments first (which gives us discussion context),
 * then use a separate endpoint to get paper data. Since we store
 * discussion_id on the paper lookup response, we pass the discussion
 * ID to a backend route that returns paper + discussion in one call.
 *
 * For now we use GET /discussions/:id which we'll add to the backend,
 * or we fetch the paper via a stored DOI. The cleanest approach for
 * the frontend is a single GET /discussions/:id endpoint that returns
 * { discussion, paper, comments }.
 *
 * Since that endpoint doesn't exist yet, we fetch comments (which
 * works) and derive paper info from a parallel call to a new
 * GET /discussions/:id/paper endpoint we add now.
 */
export default function Discussion() {
  const { id: discussionId } = useParams()
  const navigate = useNavigate()

  const [paper, setPaper] = useState(null)
  const [comments, setComments] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      setLoading(true)
      setError('')
      try {
        // Fetch paper info and comments in parallel
        const [paperRes, commentsRes] = await Promise.all([
          fetch(`${import.meta.env.VITE_API_URL}/discussions/${discussionId}/paper`, {
            credentials: 'include'
          }).then(r => r.json()),
          getComments(discussionId)
        ])

        if (paperRes.error) {
          setError(paperRes.error)
          return
        }

        setPaper(paperRes.paper)
        setComments(commentsRes.comments)
        setNextCursor(commentsRes.next_cursor)
      } catch (err) {
        setError('Failed to load discussion')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [discussionId])

  async function loadMore() {
    if (!nextCursor) return
    try {
      const res = await getComments(discussionId, nextCursor)
      setComments(prev => [...prev, ...res.comments])
      setNextCursor(res.next_cursor)
    } catch (err) {
      console.error('Failed to load more comments', err)
    }
  }

  if (loading) {
    return (
      <Layout>
        <p className={styles.loading}>Loading...</p>
      </Layout>
    )
  }

  if (error) {
    return (
      <Layout>
        <p className={styles.error}>{error}</p>
      </Layout>
    )
  }

  const sidebar = paper ? (
    <PaperSidebar paper={paper} discussionId={discussionId} />
  ) : null

  return (
    <Layout sidebar={sidebar}>
      {paper && <PaperHeader paper={paper} />}
      <div className={styles.divider} />
      <CommentThread
        discussionId={discussionId}
        comments={comments}
        setComments={setComments}
        nextCursor={nextCursor}
        onLoadMore={loadMore}
      />
    </Layout>
  )
}
