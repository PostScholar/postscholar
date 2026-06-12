'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/context/AuthContext'
import styles from '../../../login/Auth.module.css'

function GitHubCallbackInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [message, setMessage] = useState('Signing in with GitHub…')

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state) {
      setMessage('Invalid callback — missing code or state.')
      return
    }

    async function exchange() {
      try {
        const res = await fetch(`${getApiUrl()}/auth/github/callback`, {
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
        await refreshUser()
        router.push('/')
      } catch {
        setMessage('Failed to reach server')
      }
    }

    exchange()
  }, [searchParams, router, refreshUser])

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

export default function GitHubCallbackPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <GitHubCallbackInner />
    </Suspense>
  )
}
