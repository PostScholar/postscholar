'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/context/AuthContext'
import styles from '../../../login/Auth.module.css'

function OAuthCallback({ provider, endpoint }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [message, setMessage] = useState(`Signing in with ${provider}…`)
  const exchanged = useRef(false)

  useEffect(() => {
    if (exchanged.current) return

    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) {
      setMessage('Invalid callback — missing code or state.')
      return
    }

    exchanged.current = true

    async function exchange() {
      try {
        const res = await fetch(`${getApiUrl()}${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ code, state }),
        })
        const data = await res.json()
        if (!res.ok) {
          setMessage(data.error || 'Sign-in failed')
          return
        }

        if (data.linked && data.mode === 'link') {
          setMessage(`${provider} connected. Redirecting to settings…`)
          router.push(`/settings?linked=${data.provider}`)
          return
        }

        await refreshUser()
        router.push('/')
      } catch {
        setMessage('Failed to reach server')
      }
    }

    exchange()
  }, [searchParams, router, endpoint, provider, refreshUser])

  return (
    <div className={styles.page}>
      <div className={styles.formPanel} style={{ width: '100%' }}>
        <div className={styles.card}>
          <p className={styles.subtitle}>{message}</p>
        </div>
      </div>
    </div>
  )
}

function GoogleCallbackInner() {
  return <OAuthCallback provider="Google" endpoint="/auth/google/callback" />
}

export default function GoogleCallbackPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <GoogleCallbackInner />
    </Suspense>
  )
}
