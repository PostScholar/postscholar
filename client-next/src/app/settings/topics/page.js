'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { getFollowedTopics, unfollowTopic, followTopic, getTopics } from '@/lib/api'
import Layout from '@/components/Layout'
import styles from './Topics.module.css'

function flattenTopics(topics) {
  const flat = []
  for (const parent of topics) {
    flat.push({ slug: parent.slug, name: parent.name, isParent: true })
    for (const child of parent.children || []) {
      flat.push({ slug: child.slug, name: child.name, parent: parent.name })
    }
  }
  return flat
}

export default function TopicsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [followed, setFollowed] = useState([])
  const [allTopics, setAllTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [followedData, topicsData] = await Promise.all([
        getFollowedTopics(),
        getTopics(),
      ])
      setFollowed(followedData.topics || [])
      setAllTopics(topicsData.topics || [])
    } catch (err) {
      console.error('Failed to load topics:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    loadData()
  }, [user, authLoading, router, loadData])

  const followedSlugs = new Set(followed.map(t => t.topic))

  async function handleFollow(slug) {
    setActionLoading(slug)
    try {
      await followTopic(slug)
      setFollowed(prev => [{ topic: slug, created_at: new Date().toISOString() }, ...prev])
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  async function handleUnfollow(slug) {
    setActionLoading(slug)
    try {
      await unfollowTopic(slug)
      setFollowed(prev => prev.filter(t => t.topic !== slug))
    } catch (err) {
      alert(err.message)
    } finally {
      setActionLoading(null)
    }
  }

  if (loading) {
    return (
      <Layout>
        <div className={styles.page}>
          <p className={styles.loading}>Loading...</p>
        </div>
      </Layout>
    )
  }

  const flatTopics = flattenTopics(allTopics)
  const slugToName = Object.fromEntries(flatTopics.map(t => [t.slug, t.name]))

  return (
    <Layout>
      <div className={styles.page}>
        <Link href="/settings" className="backLink">← Settings</Link>
        <h1 className={styles.heading}>Followed topics</h1>
        <p className={styles.description}>
          Follow topics to personalize your feed. Browse the list below to add more.
        </p>

        {followed.length > 0 && (
          <section className={styles.section}>
            <h2 className={styles.sectionTitle}>Your topics</h2>
            <div className={styles.list}>
              {followed.map(t => (
                <div key={t.topic} className={styles.item}>
                  <span className={styles.topicName}>
                    {slugToName[t.topic] || t.topic}
                  </span>
                  <button
                    className={styles.unfollowBtn}
                    onClick={() => handleUnfollow(t.topic)}
                    disabled={actionLoading === t.topic}
                  >
                    {actionLoading === t.topic ? '…' : 'Unfollow'}
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Browse topics</h2>
          {flatTopics.length === 0 ? (
            <p className={styles.empty}>No topics available yet.</p>
          ) : (
            <div className={styles.list}>
              {flatTopics.map(t => {
                const isFollowing = followedSlugs.has(t.slug)
                return (
                  <div key={t.slug} className={styles.item}>
                    <div className={styles.topicInfo}>
                      <span className={styles.topicName}>{t.name}</span>
                      {t.parent && (
                        <span className={styles.topicParent}>{t.parent}</span>
                      )}
                    </div>
                    <button
                      className={isFollowing ? styles.unfollowBtn : styles.followBtn}
                      onClick={() => isFollowing ? handleUnfollow(t.slug) : handleFollow(t.slug)}
                      disabled={actionLoading === t.slug}
                    >
                      {actionLoading === t.slug
                        ? '…'
                        : isFollowing ? 'Following' : 'Follow'}
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </Layout>
  )
}
