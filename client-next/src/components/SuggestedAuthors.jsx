'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { followUser, unfollowUser, getSuggestedUsers } from '@/lib/api'
import styles from './SuggestedAuthors.module.css'

export default function SuggestedAuthors() {
  const { user } = useAuth()
  const [authors, setAuthors] = useState([])
  const [loading, setLoading] = useState(true)
  const [followingState, setFollowingState] = useState({})

  useEffect(() => {
    fetchSuggestedAuthors()
  }, [])

  async function fetchSuggestedAuthors() {
    try {
      const data = await getSuggestedUsers()
      setAuthors(data.users || [])
      const initialState = {}
      ;(data.users || []).forEach(u => {
        initialState[u.id] = u.is_following || false
      })
      setFollowingState(initialState)
    } catch (err) {
      console.error('Failed to fetch suggested authors:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleFollow(author) {
    if (!user) return
    try {
      if (followingState[author.id]) {
        await unfollowUser(author.username)
        setFollowingState(prev => ({ ...prev, [author.id]: false }))
      } else {
        await followUser(author.username)
        setFollowingState(prev => ({ ...prev, [author.id]: true }))
      }
    } catch (err) {
      console.error('Follow error:', err)
    }
  }

  if (loading) return null
  if (authors.length === 0) return null

  return (
    <aside className={styles.sidebar}>
      <h3 className={styles.title}>Active researchers</h3>
      <div className={styles.list}>
        {authors.slice(0, 5).map(author => (
          <div key={author.id} className={styles.authorCard}>
            <Link href={`/u/${author.username}`} className={styles.authorLink}>
              <div className={styles.avatar}>
                {author.username.slice(0, 2).toUpperCase()}
              </div>
              <div className={styles.info}>
                <div className={styles.username}>{author.username}</div>
                {author.affiliation && (
                  <div className={styles.affiliation}>{author.affiliation}</div>
                )}
              </div>
            </Link>
            {user && user.username !== author.username && (
              <button
                className={`${styles.followBtn} ${followingState[author.id] ? styles.following : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  handleFollow(author)
                }}
              >
                {followingState[author.id] ? 'Following' : 'Follow'}
              </button>
            )}
          </div>
        ))}
      </div>
    </aside>
  )
}
