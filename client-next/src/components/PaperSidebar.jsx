'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import styles from './PaperSidebar.module.css'

/**
 * PaperSidebar
 *
 * Right sidebar on the discussion page.
 * Shows paper stats (DOI, year, journal, source) and
 * the ORCID verification CTA for logged-in users.
 */
export default function PaperSidebar({ paper, discussionId }) {
  const { user } = useAuth()
  const router = useRouter()

  function handleVerify() {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/verify?discussion_id=${discussionId}`)
  }

  return (
    <div className={styles.sidebar}>
      {/* Paper stats */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>About this paper</div>
        <div className={styles.statList}>
          {paper.year && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Year</span>
              <span className={styles.statValue}>{paper.year}</span>
            </div>
          )}
          {paper.journal && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>Journal</span>
              <span className={styles.statValue}>{paper.journal}</span>
            </div>
          )}
          {paper.doi && (
            <div className={styles.stat}>
              <span className={styles.statLabel}>DOI</span>
              <a
                href={`https://doi.org/${paper.doi}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.doiLink}
              >
                {paper.doi}
              </a>
            </div>
          )}
          <div className={styles.stat}>
            <span className={styles.statLabel}>Source</span>
            <span className={styles.statValue}>
              {paper.source === 'crossref' ? 'CrossRef' : 'Manual'}
            </span>
          </div>
        </div>
      </div>

      {/* Verification CTA */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Are you an author?</div>
        <p className={styles.verifyDesc}>
          Verify via ORCID to receive an author badge on your comments in this discussion.
        </p>
        <button className={styles.verifyBtn} onClick={handleVerify}>
          Verify with ORCID
        </button>
      </div>
    </div>
  )
}