'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/navigation'
import { getMentions, markMentionRead, markAllMentionsRead } from '@/lib/api'
import Layout from '@/components/Layout'
import styles from './Mentions.module.css'

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

export default function MentionsPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [mentions, setMentions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    loadMentions()
  }, [user, authLoading, filter, router])

  async function loadMentions() {
    setLoading(true)
    try {
      const data = await getMentions(filter === 'unread')
      setMentions(data.mentions)
    } catch (err) {
      console.error('Failed to load mentions:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleMarkRead(mentionId) {
    try {
      await markMentionRead(mentionId)
      setMentions(prev => prev.map(m =>
        m.id === mentionId ? { ...m, read: true } : m
      ))
    } catch (err) {
      console.error('Failed to mark mention as read:', err)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllMentionsRead()
      setMentions(prev => prev.map(m => ({ ...m, read: true })))
    } catch (err) {
      console.error('Failed to mark all as read:', err)
    }
  }

  if (authLoading || (!user && loading)) {
    return (
      <Layout>
        <div className={styles.page}>
          <p className={styles.loading}>Loading mentions...</p>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
    <div className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Mentions</h1>
        <div className={styles.filters}>
          <button
            className={`${styles.filterBtn} ${filter === 'all' ? styles.active : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`${styles.filterBtn} ${filter === 'unread' ? styles.active : ''}`}
            onClick={() => setFilter('unread')}
          >
            Unread
          </button>
        </div>
        {mentions.some(m => !m.read) && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {mentions.length === 0 ? (
        <p className={styles.empty}>
          {filter === 'unread'
            ? 'Nothing unread — mentions and appreciations appear here.'
            : 'No mentions or appreciations yet'}
        </p>
      ) : (
        <div className={styles.list}>
          {mentions.map(mention => (
            <div
              key={mention.id}
              className={`${styles.item} ${mention.read ? styles.read : styles.unread}`}
            >
              <div className={styles.itemHeader}>
                <Link href={`/u/${mention.mentioning_username}`} className={styles.username}>
                  @{mention.mentioning_username}
                </Link>
                <span className={styles.action}>
                  {mention.type === 'appreciation'
                    ? 'appreciated your comment in'
                    : 'mentioned you in'}
                </span>
                <Link href={`/d/${mention.discussion_id}`} className={styles.discussionLink}>
                  {mention.discussion_title}
                </Link>
                <span className={styles.time}>{timeAgo(mention.created_at)}</span>
              </div>
              <p className={styles.commentBody}>
                {mention.comment_body.length > 200
                  ? mention.comment_body.slice(0, 200) + '…'
                  : mention.comment_body}
              </p>
              {!mention.read && (
                <button
                  className={styles.markReadBtn}
                  onClick={() => handleMarkRead(mention.id)}
                >
                  Mark as read
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
    </Layout>
  )
}
