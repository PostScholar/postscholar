'use client'

import { Suspense, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { getApiUrl } from '@/lib/config'
import Logo from '@/components/Logo'
import { AuthBrandPanel } from '@/components/AuthLayout'
import PasswordInput from '@/components/PasswordInput'
import styles from '../login/Auth.module.css'

function ResetPasswordInner() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token')
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`${getApiUrl()}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setDone(true)
      setTimeout(() => router.push('/login'), 2000)
    } catch {
      setError('Failed to reach server')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <div className={styles.page}>
        <div className={styles.formPanel} style={{ width: '100%' }}>
          <div className={styles.card}>
            <p className={styles.error}>Invalid reset link. Please request a new one.</p>
            <p className={styles.switchLink}><Link href="/forgot-password">Request reset link</Link></p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <div className={styles.header}>
            <Logo variant="full" href="/" className={styles.mobileLogo} />
            <h1 className={styles.title}>Set new password</h1>
          </div>

          {done ? (
            <div className={styles.successBox}>
              Password updated. Redirecting to sign in…
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <PasswordInput
                id="password"
                name="password"
                label="New password"
                autoComplete="new-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <PasswordInput
                id="confirm"
                name="confirm"
                label="Confirm password"
                autoComplete="new-password"
                value={confirm}
                onChange={e => setConfirm(e.target.value)}
              />
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Updating…' : 'Update password'}
              </button>
            </form>
          )}

          <p className={styles.switchLink}>
            <Link href="/login">Back to sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPassword() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <ResetPasswordInner />
    </Suspense>
  )
}
