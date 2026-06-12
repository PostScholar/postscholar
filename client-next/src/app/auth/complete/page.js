'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/config'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import { AuthBrandPanel } from '@/components/AuthLayout'
import styles from '../../login/Auth.module.css'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

function AuthCompleteInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { refreshUser } = useAuth()
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const token = searchParams.get('token')
  const prefilledName = searchParams.get('name')

  useEffect(() => {
    if (prefilledName) setDisplayName(prefilledName)
  }, [prefilledName])

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.formPanel} style={{ width: '100%' }}>
          <div className={styles.card}>
            <p className={styles.error}>Missing completion token. Please sign in with ORCID again.</p>
            <p className={styles.switchLink}><Link href="/login">Back to sign in</Link></p>
          </div>
        </div>
      </div>
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)

    if (!USERNAME_REGEX.test(username)) {
      setError('Username must be 3–30 characters: lowercase letters, numbers, underscores')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/auth/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          token,
          username,
          display_name: displayName || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Could not complete signup')
      await refreshUser()
      router.push('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Logo variant="full" href="/" className={styles.mobileLogo} />
            <h1 className={styles.title}>Complete your profile</h1>
            <p className={styles.subtitle}>Choose a username for your ORCID account</p>
          </div>

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="display_name">Display name</label>
              <p className={styles.hint}>Optional — how your name appears on comments</p>
              <input
                className={styles.input}
                id="display_name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <p className={styles.hint}>Used in your profile URL and @mentions</p>
              <input
                className={styles.input}
                id="username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                required
              />
            </div>

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function AuthCompletePage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <AuthCompleteInner />
    </Suspense>
  )
}
