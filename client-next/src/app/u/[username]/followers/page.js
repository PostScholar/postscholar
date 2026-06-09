'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { getFollowers } from '@/lib/api'
import styles from './FollowList.module.css'

export default function FollowersPage() {
  const params = useParams()
  const username = params.username
  const [followers, setFollowers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFollowers(username)
        setFollowers(data.followers)
      } catch (err) {
        console.error('Failed to load followers:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [username])

  return (
    <Layout>
      <div className={styles.page}>
        <Link href={`/u/${username}`} className="backLink">← Back to profile</Link>
        <h1 className={styles.heading}>Followers</h1>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : followers.length === 0 ? (
          <p className={styles.empty}>No followers yet.</p>
        ) : (
          <div className={styles.list}>
            {followers.map(f => (
              <Link key={f.id} href={`/u/${f.username}`} className={styles.item}>
                <div className={styles.avatar}>{f.username.slice(0, 2).toUpperCase()}</div>
                <div className={styles.info}>
                  <div className={styles.username}>{f.username}</div>
                  {f.bio && <div className={styles.bio}>{f.bio}</div>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
