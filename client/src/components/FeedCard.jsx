import { Link } from 'react-router-dom'
import styles from './FeedCard.module.css'

/**
 * FeedCard
 *
 * Displays a single discussion in the feed.
 * Props:
 *   discussion: {
 *     id, paper: { title, authors, journal, year },
 *     comment_count, last_activity
 *   }
 *
 * Unanswered discussions (comment_count === 0) render with
 * dashed border and muted styling.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  const names = authors.map(a => a.family || `${a.given} ${a.family}`).filter(Boolean)
  if (names.length === 1) return names[0]
  if (names.length === 2) return names.join(' · ')
  return `${names[0]} · ${names[1]} +${names.length - 2}`
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function FeedCard({ discussion }) {
  const { paper, comment_count, last_activity } = discussion
  const unanswered = comment_count === 0

  return (
    <Link
      to={`/d/${discussion.id}`}
      className={`${styles.card} ${unanswered ? styles.unanswered : ''}`}
    >
      {/* Paper title */}
      <h2 className={styles.title}>{paper.title}</h2>

      {/* Metadata row */}
      <div className={styles.meta}>
        {formatAuthors(paper.authors) && (
          <span>{formatAuthors(paper.authors)}</span>
        )}
        {paper.journal && <span>{paper.journal}</span>}
        {paper.year && <span>{paper.year}</span>}
      </div>

      {/* Footer row */}
      <div className={styles.footer}>
        <span className={styles.commentCount}>
          {unanswered
            ? 'No comments yet'
            : `${comment_count} comment${comment_count === 1 ? '' : 's'}`
          }
        </span>
        <span className={styles.time}>{timeAgo(last_activity)}</span>
      </div>
    </Link>
  )
}
