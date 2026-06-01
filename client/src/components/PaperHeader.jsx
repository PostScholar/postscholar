import { useState } from 'react'
import styles from './PaperHeader.module.css'

/**
 * PaperHeader
 *
 * Displays paper title, authors, journal/year, collapsible abstract,
 * custom tags, and who started the discussion + when.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  return authors.map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', ')
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
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function PaperHeader({ paper, startedBy, discussionCreatedAt, customTags = [] }) {
  const [abstractOpen, setAbstractOpen] = useState(false)

  return (
    <div className={styles.header}>
      {/* Source badge */}
      <div className={styles.sourceBadge}>
        {paper.source === 'crossref' ? 'Via CrossRef' : 'Manual entry'}
      </div>

      {/* Title */}
      <h1 className={`${styles.title} paper-title`}>{paper.title}</h1>

      {/* Authors */}
      {paper.authors_json?.length > 0 && (
        <p className={styles.authors}>{formatAuthors(paper.authors_json)}</p>
      )}

      {/* Journal + year + DOI */}
      <div className={styles.meta}>
        {paper.journal && <span>{paper.journal}</span>}
        {paper.year && <span>{paper.year}</span>}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.doiLink}
          >
            {paper.doi}
          </a>
        )}
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div className={styles.tags}>
          {customTags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Abstract */}
      {paper.abstract && (
        <div className={styles.abstractSection}>
          <button
            className={styles.abstractToggle}
            onClick={() => setAbstractOpen(o => !o)}
          >
            {abstractOpen ? 'Hide abstract' : 'Show abstract'}
          </button>
          {abstractOpen && (
            <p className={styles.abstract}>{paper.abstract}</p>
          )}
        </div>
      )}

      {/* Who started the discussion */}
      {startedBy && (
        <p className={styles.startedBy}>
          Discussion started by <strong>{startedBy}</strong>
          {discussionCreatedAt && <> · {timeAgo(discussionCreatedAt)}</>}
        </p>
      )}
    </div>
  )
}
