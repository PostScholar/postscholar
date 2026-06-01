import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import FeedCard from '../components/FeedCard'
import TopicDropdown from '../components/TopicDropdown'
import SortDropdown from '../components/SortDropdown'
import styles from './Home.module.css'

/**
 * Home — feed page at /
 *
 * Fetches real discussions from GET /explore.
 * Supports filter tabs, topic filter, and sort options.
 */

const FILTERS = ['All', 'Unanswered', 'New']

const SORT_OPTIONS = [
  { value: 'recent',       label: 'Most active' },
  { value: 'new',          label: 'Newest discussion' },
  { value: 'oldest',       label: 'Oldest discussion' },
  { value: 'pub_date_desc', label: 'Publication date ↓' },
  { value: 'pub_date_asc',  label: 'Publication date ↑' },
]

export default function Home() {
  const [discussions, setDiscussions] = useState([])
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [nextCursor, setNextCursor] = useState(null)

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeTopic, setActiveTopic] = useState('')
  const [activeSort, setActiveSort] = useState('recent')

  // Fetch topics once on mount
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/topics`)
      .then(r => r.json())
      .then(data => setTopics(data.topics || []))
      .catch(() => {})
  }, [])

  // Refetch when filter, topic, or sort changes
  useEffect(() => {
    fetchDiscussions(true)
  }, [activeFilter, activeTopic, activeSort])

  async function fetchDiscussions(reset = false, cursor = null) {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError('')

    try {
      const params = new URLSearchParams()
      if (activeFilter !== 'All') params.set('filter', activeFilter.toLowerCase())
      if (activeTopic) params.set('topic', activeTopic)
      if (activeSort) params.set('sort', activeSort)
      if (cursor) params.set('cursor', cursor)

      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/explore?${params.toString()}`
      )
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to load discussions')
        return
      }

      if (reset) {
        setDiscussions(data.discussions || [])
      } else {
        setDiscussions(prev => [...prev, ...(data.discussions || [])])
      }
      setNextCursor(data.next_cursor)
    } catch {
      setError('Failed to load discussions')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function handleLoadMore() {
    if (nextCursor) fetchDiscussions(false, nextCursor)
  }

  return (
    <Layout>
      <div className={styles.header}>
        <h1 className={styles.heading}>Discussions</h1>
        <p className={styles.subheading}>Academic papers, open for discussion.</p>
      </div>

      {/* Controls — tabs + topic filter + sort */}
      <div className={styles.controlsRow}>
        <div className={styles.tabs}>
          {FILTERS.map(f => (
            <button
              key={f}
              className={`${styles.tab} ${activeFilter === f ? styles.activeTab : ''}`}
              onClick={() => setActiveFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>

        <div className={styles.dropdowns}>
          <TopicDropdown
            topics={topics}
            value={activeTopic}
            onChange={setActiveTopic}
          />
          <SortDropdown
            options={SORT_OPTIONS}
            value={activeSort}
            onChange={setActiveSort}
          />
        </div>
      </div>

      {/* Feed */}
      {loading ? (
        <p className={styles.state}>Loading...</p>
      ) : error ? (
        <p className={styles.errorState}>{error}</p>
      ) : discussions.length === 0 ? (
        <p className={styles.state}>No discussions found.</p>
      ) : (
        <div className={styles.feed}>
          {discussions.map(d => (
            <FeedCard key={d.id} discussion={d} />
          ))}
        </div>
      )}

      {nextCursor && !loading && (
        <button
          className={styles.loadMoreBtn}
          onClick={handleLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? 'Loading...' : 'Load more'}
        </button>
      )}
    </Layout>
  )
}
