'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import Layout from '@/components/Layout'
import { getFollowing } from '@/lib/api'
import styles from '../followers/FollowList.module.css'

export default function FollowingPage() {
  const params = useParams()
  const username = params.username
  const [following, setFollowing] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const data = await getFollowing(username)
        setFollowing(data.following)
      } catch (err) {
        console.error('Failed to load following:', err)
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
        <h1 className={styles.heading}>Following</h1>
        {loading ? (
          <p className={styles.loading}>Loading...</p>
        ) : following.length === 0 ? (
          <p className={styles.empty}>Not following anyone yet.</p>
        ) : (
          <div className={styles.list}>
            {following.map(f => (
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
