'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/config'
import Logo from '@/components/Logo'
import styles from '@/app/login/Auth.module.css'

async function startOAuth(path) {
  const res = await fetch(`${getApiUrl()}${path}`, { credentials: 'include' })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'OAuth unavailable')
  window.location.href = data.url
}

export default function SocialAuthButtons() {
  const [loading, setLoading] = useState(null)
  const [error, setError] = useState(null)

  async function handleOAuth(provider, path) {
    setLoading(provider)
    setError(null)
    try {
      await startOAuth(path)
    } catch (err) {
      setError(err.message)
      setLoading(null)
    }
  }

  return (
    <div className={styles.social}>
      <button
        type="button"
        className={`${styles.socialBtn} ${styles.orcidBtn}`}
        onClick={() => handleOAuth('orcid', '/auth/orcid/login/url')}
        disabled={!!loading}
      >
        {loading === 'orcid' ? 'Redirecting…' : 'Continue with ORCID'}
      </button>
      <button
        type="button"
        className={`${styles.socialBtn} ${styles.googleBtn}`}
        onClick={() => handleOAuth('google', '/auth/google/url')}
        disabled={!!loading}
      >
        {loading === 'google' ? 'Redirecting…' : 'Continue with Google'}
      </button>
      <button
        type="button"
        className={`${styles.socialBtn} ${styles.githubBtn}`}
        onClick={() => handleOAuth('github', '/auth/github/url')}
        disabled={!!loading}
      >
        {loading === 'github' ? 'Redirecting…' : 'Continue with GitHub'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.divider}>
        <span>or continue with email</span>
      </div>
    </div>
  )
}

export function AuthBrandPanel() {
  return (
    <div className={styles.brandPanel}>
      <Logo variant="full" href="/" className={styles.brandLogo} />
      <h2 className={styles.brandTitle}>
        Post-publication discussion for published research
      </h2>
      <ul className={styles.brandList}>
        <li>DOI-backed discussion threads</li>
        <li>ORCID author verification badges</li>
        <li>Quiet, scholarly conversation</li>
      </ul>
      <p className={styles.brandFooter}>
        <Link href="/terms">Terms</Link>
        {' · '}
        <Link href="/privacy">Privacy</Link>
      </p>
    </div>
  )
}
