'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getFollowingFeed, getBookmarks, getExplore, normalizeDiscussion } from '@/lib/api'
import FeedCard from '@/components/FeedCard'
import BrowseSidebar from '@/components/BrowseSidebar'
import SuggestedAuthors from '@/components/SuggestedAuthors'
import SortDropdown from '@/components/SortDropdown'
import TopicDropdown from '@/components/TopicDropdown'
import styles from './Explore.module.css'

const FILTERS = ['All', 'New', 'Following', 'Bookmarks']

const FILTER_FROM_URL = {
  all: 'All',
  new: 'New',
  following: 'Following',
  bookmarks: 'Bookmarks',
}

const SORT_OPTIONS = [
  { value: 'recent',       label: 'Most active' },
  { value: 'new',          label: 'Newest discussion' },
  { value: 'oldest',       label: 'Oldest discussion' },
  { value: 'pub_date_desc', label: 'Publication date ↓' },
  { value: 'pub_date_asc',  label: 'Publication date ↑' },
]

export default function ExploreFeed({ initialDiscussions, initialTopics, initialNextCursor = null }) {
  const { user } = useAuth()
  const searchParams = useSearchParams()
  const topicFromUrl = searchParams.get('topic') || ''
  const filterFromUrl = searchParams.get('filter') || ''
  const [discussions, setDiscussions] = useState(
    (initialDiscussions || []).map(normalizeDiscussion)
  )
  const [topics, setTopics] = useState(initialTopics)
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
    const mapped = FILTER_FROM_URL[filterFromUrl.toLowerCase()]
    if (mapped) {
      setActiveFilter(mapped)
      if (mapped === 'Following' || mapped === 'Bookmarks') {
        setActiveTopic('')
      }
    }
  }, [filterFromUrl])

  function handleFilterChange(filter) {
    setActiveFilter(filter)
    setActiveTopic('')
  }

  function handleTopicChange(topic) {
    setActiveTopic(prev => prev === topic ? '' : topic)
  }

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
      let data

      if (activeFilter === 'Following') {
        if (!user) {
          setDiscussions([])
          setNextCursor(null)
          setError('Sign in to see discussions from people you follow')
          return
        }
        data = await getFollowingFeed(cursor)
      } else if (activeFilter === 'Bookmarks') {
        if (!user) {
          setDiscussions([])
          setNextCursor(null)
          setError('Sign in to see your saved discussions')
          return
        }
        const bookmarksData = await getBookmarks()
        data = {
          discussions: bookmarksData.bookmarks || [],
          next_cursor: null,
        }
      } else {
        data = await getExplore({
          filter: activeFilter !== 'All' ? activeFilter.toLowerCase() : undefined,
          topic: activeTopic || undefined,
          sort: activeSort,
          cursor,
        })
      }

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
    <div className={styles.layout}>
      <BrowseSidebar
        topics={topics}
        activeTopic={activeTopic}
        onTopicChange={handleTopicChange}
        activeFilter={activeFilter}
        onFilterChange={handleFilterChange}
      />

      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Discussions</h1>
          <p className={styles.subheading}>Browse and filter academic paper threads</p>
        </div>

        <div className={styles.controlsRow}>
          <div className={styles.mobileTabs}>
            {FILTERS.map(f => (
              <button
                key={f}
                className={`${styles.mobileTab} ${activeFilter === f ? styles.mobileTabActive : ''}`}
                onClick={() => handleFilterChange(f)}
              >
                {f}
              </button>
            ))}
          </div>
          {activeFilter !== 'Following' && activeFilter !== 'Bookmarks' && (
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
          )}
        </div>

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
      </main>

      <SuggestedAuthors />
    </div>
  )
}
