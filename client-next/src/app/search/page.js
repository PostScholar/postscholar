'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { searchDiscussions, getTopics } from '@/lib/api'
import Layout from '@/components/Layout'
import FeedCard from '@/components/FeedCard'
import styles from './Search.module.css'

function flattenTopics(topics) {
  const flat = []
  for (const parent of topics) {
    flat.push({ slug: parent.slug, name: parent.name })
    for (const child of parent.children || []) {
      flat.push({ slug: child.slug, name: `${parent.name} › ${child.name}` })
    }
  }
  return flat
}

function SearchPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const q = searchParams.get('q') || ''
  const topicParam = searchParams.get('topic') || ''
  const yearFromParam = searchParams.get('year_from') || ''
  const yearToParam = searchParams.get('year_to') || ''
  const sortParam = searchParams.get('sort') || 'recent'

  const [results, setResults] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')
  const [topics, setTopics] = useState([])
  const [showFilters, setShowFilters] = useState(false)
  const [topic, setTopic] = useState(topicParam)
  const [yearFrom, setYearFrom] = useState(yearFromParam)
  const [yearTo, setYearTo] = useState(yearToParam)
  const [sort, setSort] = useState(sortParam)

  useEffect(() => {
    getTopics()
      .then(data => setTopics(flattenTopics(data.topics || [])))
      .catch(() => {})
  }, [])

  useEffect(() => {
    setTopic(topicParam)
    setYearFrom(yearFromParam)
    setYearTo(yearToParam)
    setSort(sortParam)
    if (topicParam || yearFromParam || yearToParam) {
      setShowFilters(true)
    }
  }, [topicParam, yearFromParam, yearToParam, sortParam])

  const doSearch = useCallback(async (query, type, filters) => {
    const hasQuery = query.trim()
    const hasFilters = filters.topic || filters.yearFrom || filters.yearTo
    if (!hasQuery && !hasFilters) {
      setResults([])
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const data = await searchDiscussions(query, {
        type,
        topic: filters.topic || undefined,
        yearFrom: filters.yearFrom || undefined,
        yearTo: filters.yearTo || undefined,
        sort: filters.sort || 'recent',
      })
      setResults(data.results || [])
      setUsers(data.users || [])
    } catch {
      setResults([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doSearch(q, activeTab, { topic: topicParam, yearFrom: yearFromParam, yearTo: yearToParam, sort: sortParam })
  }, [q, activeTab, topicParam, yearFromParam, yearToParam, sortParam, doSearch])

  function applyFilters(e) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (topic) params.set('topic', topic)
    if (yearFrom) params.set('year_from', yearFrom)
    if (yearTo) params.set('year_to', yearTo)
    if (sort && sort !== 'recent') params.set('sort', sort)
    router.push(`/search?${params.toString()}`)
  }

  function clearFilters() {
    setTopic('')
    setYearFrom('')
    setYearTo('')
    setSort('recent')
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    router.push(`/search?${params.toString()}`)
  }

  const hasActiveFilters = topicParam || yearFromParam || yearToParam || (sortParam && sortParam !== 'recent')

  return (
    <Layout>
      <div className={styles.page}>
        {(q || hasActiveFilters) && (
          <>
            <div className={styles.toolbar}>
              <div className={styles.tabs}>
                <button
                  className={`${styles.tab} ${activeTab === 'all' ? styles.active : ''}`}
                  onClick={() => setActiveTab('all')}
                >
                  All
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`}
                  onClick={() => setActiveTab('discussions')}
                >
                  Discussions
                </button>
                <button
                  className={`${styles.tab} ${activeTab === 'users' ? styles.active : ''}`}
                  onClick={() => setActiveTab('users')}
                >
                  People
                </button>
              </div>
              {activeTab !== 'users' && (
                <button
                  type="button"
                  className={`${styles.filterToggle} ${showFilters ? styles.filterToggleActive : ''}`}
                  onClick={() => setShowFilters(!showFilters)}
                >
                  Filters{hasActiveFilters ? ' ·' : ''}
                </button>
              )}
            </div>

            {showFilters && activeTab !== 'users' && (
              <form className={styles.filters} onSubmit={applyFilters}>
                <div className={styles.filterField}>
                  <label htmlFor="topic" className={styles.filterLabel}>Topic</label>
                  <select
                    id="topic"
                    className={styles.filterSelect}
                    value={topic}
                    onChange={e => setTopic(e.target.value)}
                  >
                    <option value="">Any topic</option>
                    {topics.map(t => (
                      <option key={t.slug} value={t.slug}>{t.name}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="yearFrom" className={styles.filterLabel}>Year from</label>
                  <input
                    id="yearFrom"
                    type="number"
                    className={styles.filterInput}
                    placeholder="e.g. 2015"
                    value={yearFrom}
                    onChange={e => setYearFrom(e.target.value)}
                    min="1900"
                    max="2100"
                  />
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="yearTo" className={styles.filterLabel}>Year to</label>
                  <input
                    id="yearTo"
                    type="number"
                    className={styles.filterInput}
                    placeholder="e.g. 2024"
                    value={yearTo}
                    onChange={e => setYearTo(e.target.value)}
                    min="1900"
                    max="2100"
                  />
                </div>
                <div className={styles.filterField}>
                  <label htmlFor="sort" className={styles.filterLabel}>Sort by</label>
                  <select
                    id="sort"
                    className={styles.filterSelect}
                    value={sort}
                    onChange={e => setSort(e.target.value)}
                  >
                    <option value="recent">Most recent</option>
                    <option value="oldest">Oldest first</option>
                    <option value="most_comments">Most comments</option>
                  </select>
                </div>
                <div className={styles.filterActions}>
                  <button type="submit" className={styles.applyBtn}>Apply</button>
                  {hasActiveFilters && (
                    <button type="button" className={styles.clearBtn} onClick={clearFilters}>
                      Clear
                    </button>
                  )}
                </div>
              </form>
            )}

            <p className={styles.summary}>
              {loading ? 'Searching…' : q ? `Results for "${q}"` : 'Filtered discussions'}
            </p>
          </>
        )}

        {activeTab !== 'discussions' && users.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>People</h2>
            <div className={styles.userList}>
              {users.map(user => (
                <Link key={user.id} href={`/u/${user.username}`} className={styles.userCard}>
                  <div className={styles.userAvatar}>{user.username.slice(0, 2).toUpperCase()}</div>
                  <div className={styles.userInfo}>
                    <div className={styles.userName}>{user.username}</div>
                    {user.bio && <div className={styles.userBio}>{user.bio.slice(0, 100)}</div>}
                    {user.affiliation && <div className={styles.userAffiliation}>{user.affiliation}</div>}
                    <div className={styles.userStats}>
                      {user.discussion_count} discussion{user.discussion_count !== 1 ? 's' : ''}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {activeTab !== 'users' && (
          <div className={styles.section}>
            {activeTab === 'all' && results.length > 0 && <h2 className={styles.sectionTitle}>Discussions</h2>}
            <div className={styles.results}>
              {results.map(d => (
                <FeedCard key={d.id} discussion={d} />
              ))}
              {!loading && (q || hasActiveFilters) && results.length === 0 && activeTab !== 'users' && (
                <p className={styles.empty}>No discussions found.</p>
              )}
            </div>
          </div>
        )}

        {!q && !hasActiveFilters && (
          <p className={styles.empty}>Use the search bar above to find discussions and people.</p>
        )}
      </div>
    </Layout>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>}>
      <SearchPageInner />
    </Suspense>
  )
}
