'use client'

import Link from 'next/link'
import styles from './FeedCard.module.css'

/**
 * FeedCard
 *
 * Displays a single discussion in the feed.
 * Receives the shape returned by GET /explore:
 * {
 *   id, created_at, doi, title, authors_json,
 *   journal, year, comment_count, latest_activity, topics
 * }
 *
 * Unanswered discussions (comment_count === 0) render with
 * dashed border and muted styling.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  const names = authors.map(a => a.family).filter(Boolean)
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} · ${names[1]}`
  return `${names[0]} · ${names[1]} +${names.length - 2}`
}

function timeAgo(isoString) {
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

export default function FeedCard({ discussion }) {
  const {
    id,
    title,
    authors_json,
    journal,
    year,
    comment_count,
    latest_activity,
    topics = []
  } = discussion

  const unanswered = comment_count === 0

  return (
    <Link
      href={`/d/${id}`}
      className={`${styles.card} ${unanswered ? styles.unanswered : ''}`}
    >
      {/* Paper title */}
      <h2 className={styles.title}>{title}</h2>

      {/* Metadata row */}
      <div className={styles.meta}>
        {formatAuthors(authors_json) && (
          <span>{formatAuthors(authors_json)}</span>
        )}
        {journal && <span>{journal}</span>}
        {year && <span>{year}</span>}
      </div>

      {/* Topics */}
      {topics.length > 0 && (
        <div className={styles.topics}>
          {topics.map(t => (
            <span key={t.slug} className={styles.topic}>{t.name}</span>
          ))}
        </div>
      )}

      {/* Footer row */}
      <div className={styles.footer}>
        <span className={styles.commentCount}>
          {unanswered
            ? 'No comments yet'
            : `${comment_count} comment${comment_count === 1 ? '' : 's'}`
          }
        </span>
        <span className={styles.time}>{timeAgo(latest_activity)}</span>
      </div>
    </Link>
  )
}