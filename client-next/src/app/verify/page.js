'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import styles from './Verify.module.css'

/**
 * Verify page — /verify
 *
 * Three sections:
 *   1. ORCID OAuth — primary verification method
 *   2. Manual review — fallback, textarea + submit
 *
 * The discussion_id is passed as a query param: /verify?discussion_id=xxx
 * so we know which discussion to verify for.
 *
 * In E9 the ORCID button will hit GET /auth/orcid/url?discussion_id=xxx
 * and redirect to ORCID. The callback page handles the return.
 */
export default function Verify() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const discussionId = searchParams.get('discussion_id')

  const [manualText, setManualText] = useState('')
  const [manualSubmitted, setManualSubmitted] = useState(false)
  const [manualLoading, setManualLoading] = useState(false)
  const [orcidLoading, setOrcidLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  async function handleOrcidVerify() {
    if (!discussionId) {
      setError('No discussion selected. Go back and click "Verify with ORCID" from a discussion page.')
      return
    }
    setOrcidLoading(true)
    setError('')
    try {
      // In E9: GET /auth/orcid/url?discussion_id=xxx
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/auth/orcid/url?discussion_id=${discussionId}`,
        { credentials: 'include' }
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to get ORCID URL')
        return
      }
      // Redirect to ORCID OAuth
      window.location.href = data.url
    } catch (err) {
      setError('Failed to reach server')
    } finally {
      setOrcidLoading(false)
    }
  }

  async function handleManualSubmit(e) {
    e.preventDefault()
    if (!manualText.trim()) return
    setManualLoading(true)
    setError('')
    try {
      // In E9: POST to a manual review endpoint
      // For now simulate success
      await new Promise(r => setTimeout(r, 800))
      setManualSubmitted(true)
    } catch (err) {
      setError('Failed to submit request')
    } finally {
      setManualLoading(false)
    }
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Verify as author</h1>
          <p className={styles.subheading}>
            Verified authors receive a visible badge on their comments in the discussion for that paper only.
          </p>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        {/* Section 1 — ORCID */}
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitle}>Verify with ORCID</div>
            <div className={styles.sectionBadge}>Recommended</div>
          </div>
          <p className={styles.sectionDesc}>
            Connect your ORCID account. We check whether your ORCID name matches an author on the paper. No manual review needed.
          </p>
          <button
            className={styles.orcidBtn}
            onClick={handleOrcidVerify}
            disabled={orcidLoading}
          >
            {orcidLoading ? 'Redirecting...' : 'Connect ORCID'}
          </button>
          {!discussionId && (
            <p className={styles.hint}>
              To verify, go to a discussion page and click "Verify with ORCID" from the sidebar.
            </p>
          )}
        </div>

        {/* Section 2 — Manual review */}
        <div className={`${styles.section} ${styles.muted}`}>
          <div className={styles.sectionTitle}>Request manual review</div>
          <p className={styles.sectionDesc}>
            If ORCID verification doesn't work for you, describe your authorship and we'll review manually. This may take several days.
          </p>

          {manualSubmitted ? (
            <div className={styles.successBanner}>
              Your request has been submitted. We'll be in touch via your account email.
            </div>
          ) : (
            <form className={styles.manualForm} onSubmit={handleManualSubmit}>
              <textarea
                className={styles.textarea}
                placeholder="Describe your connection to the paper — your role, institution, co-authors, or any other details that help us verify your authorship."
                value={manualText}
                onChange={e => setManualText(e.target.value)}
                rows={5}
                required
              />
              <button
                type="submit"
                className={styles.manualBtn}
                disabled={manualLoading || !manualText.trim()}
              >
                {manualLoading ? 'Submitting...' : 'Submit request'}
              </button>
            </form>
          )}
        </div>
      </div>
    </Layout>
  )
}