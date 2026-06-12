'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Bookmark } from 'lucide-react'
import ShareButton from './ShareButton'
import styles from './FeedCard.module.css'
import { createBookmark, removeBookmark, checkBookmark, normalizeDiscussion } from '@/lib/api'
import { discussionPath } from '@/lib/discussionSlug'
import { useAuth } from '@/context/AuthContext'

/**
 * FeedCard
 *
 * Displays a single discussion in the feed.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  const names = authors.map(a => a.family).filter(Boolean)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} · ${names[1]}`
  return `${names[0]} · ${names[1]} +${names.length - 2}`
}

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function FeedCard({ discussion: rawDiscussion }) {
  const discussion = normalizeDiscussion(rawDiscussion)
  const router = useRouter()
  const {
    id,
    title,
    authors_json,
    journal,
    year,
    comment_count,
    latest_activity,
    topics = [],
    username
  } = discussion

  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)

  const unanswered = comment_count === 0
  const authorLine = formatAuthors(authors_json)
  const href = discussionPath({ id, title })

  useEffect(() => {
    if (user) {
      checkBookmark(id)
        .then(data => setBookmarked(data.bookmarked))
        .catch(() => {})
    }
  }, [id, user])

  async function toggleBookmark(e) {
    e.preventDefault()
    e.stopPropagation()
    if (!user) {
      router.push('/login')
      return
    }
    if (bookmarkLoading) return

    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await removeBookmark(id)
        setBookmarked(false)
      } else {
        await createBookmark(id)
        setBookmarked(true)
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.cardBody}>
        <Link href={href} className={styles.titleLink}>
          <h2 className={`${styles.title} paper-title`}>{title}</h2>
        </Link>

        <div className={styles.meta}>
          {username && (
            <span className={styles.metaItem}>
              <span className={styles.metaLabel}>Started by</span>
              <Link href={`/u/${username}`} className={styles.author}>
                {username}
              </Link>
            </span>
          )}
          {authorLine && <span className={styles.metaItem}>{authorLine}</span>}
          {journal && <span className={styles.metaItem}>{journal}</span>}
          {year && <span className={styles.metaItem}>{year}</span>}
        </div>

        {topics.length > 0 && (
          <div className={styles.tags}>
            {topics.map(t => (
              <button
                key={t.slug}
                type="button"
                className={styles.tag}
                onClick={() => router.push(`/explore?topic=${encodeURIComponent(t.slug)}`)}
              >
                {t.name}
              </button>
            ))}
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.activity}>
            {unanswered
              ? 'No comments yet'
              : `${comment_count} comment${comment_count === 1 ? '' : 's'}`
            }
          </span>
          {latest_activity && (
            <span className={styles.activity}>{timeAgo(latest_activity)}</span>
          )}
        </div>
      </div>

      <div className={styles.cardActions}>
        <ShareButton
          url={typeof window !== 'undefined' ? `${window.location.origin}${href}` : href}
          title={title}
          size={18}
        />
        <button
          onClick={toggleBookmark}
          className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarked : ''}`}
          disabled={bookmarkLoading}
          aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark discussion'}
          title={user ? (bookmarked ? 'Remove bookmark' : 'Save discussion') : 'Sign in to bookmark'}
        >
          <Bookmark size={18} fill={bookmarked ? 'currentColor' : 'none'} />
        </button>
      </div>
    </article>
  )
}
