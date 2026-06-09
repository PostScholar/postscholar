'use client'

import { Suspense, useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { searchDiscussions } from '@/lib/api'
import Layout from '@/components/Layout'
import FeedCard from '@/components/FeedCard'
import styles from './Search.module.css'

function SearchPageInner() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('all')

  const doSearch = useCallback(async (query, type = 'all') => {
    if (!query.trim()) {
      setResults([])
      setUsers([])
      return
    }
    setLoading(true)
    try {
      const data = await searchDiscussions(query, type)
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
    doSearch(q, activeTab)
  }, [q, activeTab, doSearch])

  return (
    <Layout>
      <div className={styles.page}>
        {q && (
          <>
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

            <p className={styles.summary}>
              {loading ? 'Searching…' : `Results for "${q}"`}
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
                      {user.discussion_count} discussion{user.discussion_count !== 1 ? 's' : ''} · {user.follower_count} follower{user.follower_count !== 1 ? 's' : ''}
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
              {!loading && q && results.length === 0 && activeTab !== 'users' && (
                <p className={styles.empty}>No discussions found for "{q}".</p>
              )}
            </div>
          </div>
        )}

        {!q && (
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
