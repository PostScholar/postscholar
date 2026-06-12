'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import FeedCard from '@/components/FeedCard'
import TopicDropdown from '@/components/TopicDropdown'
import SortDropdown from '@/components/SortDropdown'
import { getExplore, normalizeDiscussion } from '@/lib/api'
import styles from './Home.module.css'

const FILTERS = ['All', 'Unanswered', 'New']

const SORT_OPTIONS = [
  { value: 'recent',       label: 'Most active' },
  { value: 'new',          label: 'Newest discussion' },
  { value: 'oldest',       label: 'Oldest discussion' },
  { value: 'pub_date_desc', label: 'Publication date ↓' },
  { value: 'pub_date_asc',  label: 'Publication date ↑' },
]

export default function HomeFeed({ initialDiscussions, initialTopics, initialNextCursor = null }) {
  const searchParams = useSearchParams()
  const topicFromUrl = searchParams.get('topic') || ''

  const [discussions, setDiscussions] = useState(
    (initialDiscussions || []).map(normalizeDiscussion)
  )
  const [topics] = useState(initialTopics)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [nextCursor, setNextCursor] = useState(initialNextCursor)

  const [activeFilter, setActiveFilter] = useState('All')
  const [activeTopic, setActiveTopic] = useState(topicFromUrl)
  const [activeSort, setActiveSort] = useState('recent')
  const skipInitialFetch = useRef(true)

  useEffect(() => {
    if (topicFromUrl) {
      setActiveTopic(topicFromUrl)
    }
  }, [topicFromUrl])

  useEffect(() => {
    const isDefault = activeFilter === 'All' && !activeTopic && activeSort === 'recent'

    if (skipInitialFetch.current) {
      skipInitialFetch.current = false
      if (isDefault) return
    }

    fetchDiscussions(true)
  }, [activeFilter, activeTopic, activeSort])

  async function fetchDiscussions(reset = false, cursor = null) {
    if (reset) setLoading(true)
    else setLoadingMore(true)
    setError('')

    try {
      const data = await getExplore({
        filter: activeFilter !== 'All' ? activeFilter.toLowerCase() : undefined,
        topic: activeTopic || undefined,
        sort: activeSort,
        cursor,
      })

      const normalized = (data.discussions || []).map(normalizeDiscussion)

      if (reset) {
        setDiscussions(normalized)
      } else {
        setDiscussions(prev => [...prev, ...normalized])
      }
      setNextCursor(data.next_cursor)
    } catch (err) {
      setError(err.message || 'Failed to load discussions')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  function handleLoadMore() {
    if (nextCursor) fetchDiscussions(false, nextCursor)
  }

  return (
    <>
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

      {loading ? (
        <p className={styles.state}>Loading...</p>
      ) : error ? (
        <p className={styles.errorState}>{error}</p>
      ) : discussions.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyTitle}>No discussions found</p>
          <p className={styles.emptyText}>
            Be the first to open a thread on a paper in your field.
          </p>
          <Link href="/start" className={styles.emptyCta}>
            Start a discussion
          </Link>
        </div>
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
    </>
  )
}
