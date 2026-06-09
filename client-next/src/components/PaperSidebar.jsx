'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getDiscussionStats } from '@/lib/api'
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
  const [stats, setStats] = useState(null)
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const data = await getDiscussionStats(discussionId)
        setStats(data)
      } catch (err) {
        console.error('Failed to load discussion stats:', err)
      } finally {
        setLoadingStats(false)
      }
    }
    fetchStats()
  }, [discussionId])

  function handleVerify() {
    if (!user) {
      router.push('/login')
      return
    }
    router.push(`/verify?discussion_id=${discussionId}`)
  }

  return (
    <div className={styles.sidebar}>
      {/* Discussion stats */}
      <div className={styles.section}>
        <div className={styles.sectionTitle}>Discussion stats</div>
        <div className={styles.statList}>
          {loadingStats ? (
            <div className={styles.stat}>
              <span className={styles.statValue}>Loading...</span>
            </div>
          ) : (
            <>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Views</span>
                <span className={styles.statValue}>{stats?.view_count || 0}</span>
              </div>
              <div className={styles.stat}>
                <span className={styles.statLabel}>Comments</span>
                <span className={styles.statValue}>{stats?.comment_count || 0}</span>
              </div>
            </>
          )}
        </div>
      </div>

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