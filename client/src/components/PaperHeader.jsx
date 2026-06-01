import { useState } from 'react'
import styles from './PaperHeader.module.css'

/**
 * PaperHeader
 *
 * Displays the paper title, authors, journal/year, and a
 * collapsible abstract. Used at the top of the discussion page.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  return authors
    .map(a => [a.given, a.family].filter(Boolean).join(' '))
    .join(', ')
}

export default function PaperHeader({ paper }) {
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

      {/* Journal + year */}
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

      {/* Abstract — collapsible */}
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
    </div>
  )
}
