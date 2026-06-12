'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Link from 'next/link'
import { getFollowingFeed, getBookmarks, getExplore, normalizeDiscussion } from '@/lib/api'
import { discussionPath } from '@/lib/discussionSlug'
import FeedCard from '@/components/FeedCard'
import FeedSkeleton from '@/components/FeedSkeleton'
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

function formatActivityTime(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function ExploreFeed({
  initialDiscussions,
  initialTopics,
  initialNextCursor = null,
  initialRecentlyActive = [],
}) {
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
  const [recentlyActive] = useState(
    (initialRecentlyActive || []).map(normalizeDiscussion)
  )

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
      const msg = err.message || 'Failed to load discussions'
      if (msg === 'Not authenticated' && (activeFilter === 'Following' || activeFilter === 'Bookmarks')) {
        setError(activeFilter === 'Following'
          ? 'Sign in to see discussions from people you follow'
          : 'Sign in to see your saved discussions')
      } else {
        setError(msg)
      }
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
          <p className={styles.subheading}>
            Post-publication discussion for published research
          </p>
        </div>

        {recentlyActive.length > 0 && activeFilter === 'All' && !activeTopic && (
          <section className={styles.activeSection} aria-label="Recently active discussions">
            <div className={styles.activeHeader}>
              <h2 className={styles.activeHeading}>Recently active</h2>
              <p className={styles.activeSubheading}>
                Discussions with recent comments
              </p>
            </div>
            <div className={styles.activeGrid}>
              {recentlyActive.map(d => (
                <Link
                  key={d.id}
                  href={discussionPath({ id: d.id, title: d.title })}
                  className={styles.activeCard}
                >
                  <h3 className={styles.activeTitle}>{d.title}</h3>
                  <p className={styles.activeMeta}>
                    {d.comment_count} comment{d.comment_count === 1 ? '' : 's'}
                    {d.latest_activity && (
                      <> · {formatActivityTime(d.latest_activity)}</>
                    )}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

        <div className={styles.controlsRow}>
          <div className={styles.mobileBrowse}>
            <p className={styles.mobileBrowseLabel}>Browse</p>
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
          <FeedSkeleton rows={5} />
        ) : error ? (
          <p className={styles.errorState}>{error}</p>
        ) : discussions.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>No discussions found</p>
            <p className={styles.emptyText}>
              {activeFilter === 'Bookmarks'
                ? 'Save discussions from the feed to find them here.'
                : activeFilter === 'Following'
                  ? 'Follow researchers to see their threads in this tab.'
                  : 'Be the first to open a thread on a paper in your field.'}
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
      </main>

      <SuggestedAuthors />
    </div>
  )
}
