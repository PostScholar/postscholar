'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/context/AuthContext'
import styles from './OrcidCallback.module.css'

function OrcidCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [status, setStatus] = useState('loading')
  const [message, setMessage] = useState('')
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return

    const code = searchParams.get('code')
    const state = searchParams.get('state')

    if (!code || !state) {
      setStatus('error')
      setMessage('Invalid callback — missing code or state.')
      return
    }

    exchanged.current = true

    async function exchange() {
      try {
        const res = await fetch(`${getApiUrl()}/auth/orcid/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        })
        const data = await res.json()

        if (!res.ok) {
          setStatus('error')
          setMessage(data.error || 'ORCID sign-in failed')
          return
        }

        if (data.needs_completion) {
          const params = new URLSearchParams({
            token: data.completion_token,
          })
          if (data.display_name) params.set('name', data.display_name)
          router.replace(`/auth/complete?${params.toString()}`)
          return
        }

        if (data.linked && data.mode === 'link') {
          setStatus('success')
          setMessage('ORCID connected to your account.')
          router.replace('/settings?linked=orcid')
          return
        }

        if (data.mode === 'login') {
          await refreshUser()
          setStatus('success')
          setMessage('Signed in with ORCID.')
          setTimeout(() => router.push('/'), 1500)
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
  }, [searchParams, router, refreshUser])

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {status === 'loading' && (
          <>
            <div className={styles.spinner} />
            <p className={styles.message}>Connecting your ORCID account…</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div className={styles.icon}>✓</div>
            <p className={`${styles.message} ${styles.success}`}>{message}</p>
            <p className={styles.hint}>Redirecting…</p>
          </>
        )}
        {(status === 'error' || status === 'no_match') && (
          <>
            <div className={`${styles.icon} ${styles.failIcon}`}>✗</div>
            <p className={`${styles.message} ${styles.fail}`}>{message}</p>
            <p className={styles.hint}>Redirecting…</p>
          </>
        )}
      </div>
    </div>
  )
}

export default function OrcidCallback() {
  return (
    <Suspense fallback={<div style={{ padding: '2rem', textAlign: 'center' }}>Loading…</div>}>
      <OrcidCallbackInner />
    </Suspense>
  )
}
