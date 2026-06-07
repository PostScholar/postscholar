'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import styles from './OrcidCallback.module.css'

/**
 * OrcidCallback — /orcid/callback
 *
 * ORCID redirects here after OAuth with ?code=xxx&state=xxx
 * We send these to POST /auth/orcid/callback which verifies
 * the author and stores the verification record.
 *
 * After success or failure, we redirect back to the discussion.
 */
export default function OrcidCallback() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [status, setStatus] = useState('loading') // loading | success | error | no_match
  const [message, setMessage] = useState('')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setStatus('error')
      setMessage('Invalid callback — missing code or state.')
      return
    }

    async function exchange() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/orcid/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state })
        })
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
          return
        }

        if (data.verified) {
          setStatus('success')
          setMessage('Author verified. Your badge will appear on your comments.')
        } else {
          setStatus('no_match')
          setMessage(data.reason || 'Your ORCID name did not match any author on this paper.')
        }

        let redirectPath = '/'
        try {
          const decoded = JSON.parse(atob(state.split('.')[1]))
          if (decoded.discussion_id) {
            redirectPath = `/d/${decoded.discussion_id}`
          }
        } catch {}

        setTimeout(() => router.push(redirectPath), 3000)
      } catch {
        setStatus('error')
        setMessage('Failed to reach server')
      }
    }

    exchange()
  }, [searchParams, router])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.message}>Verifying your ORCID...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className={styles.icon}>✓</div>
            <p className={`${styles.message} ${styles.success}`}>{message}</p>
            <p className={styles.hint}>Redirecting...</p>
          </>
        )}
        {(status === 'error' || status === 'no_match') && (
          <>
            <div className={`${styles.icon} ${styles.failIcon}`}>✗</div>
            <p className={`${styles.message} ${styles.fail}`}>{message}</p>
            <p className={styles.hint}>Redirecting...</p>
          </>
        )}
      </div>
    </div>
  )
}