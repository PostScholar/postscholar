'use client'

import { useState } from 'react'
import Link from 'next/link'
import { getApiUrl } from '@/lib/config'
import Logo from '@/components/Logo'
import { AuthBrandPanel } from '@/components/AuthLayout'
import styles from '../login/Auth.module.css'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`${getApiUrl()}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Something went wrong')
        return
      }
      setSubmitted(true)
    } catch {
      setError('Failed to reach server')
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
            <h1 className={styles.title}>Reset password</h1>
            <p className={styles.subtitle}>Enter your email and we&apos;ll send a reset link.</p>
          </div>

          {submitted ? (
            <div className={styles.successBox}>
              If that email exists, a reset link has been sent. Check your inbox.
            </div>
          ) : (
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.field}>
                <label className={styles.label} htmlFor="email">Email</label>
                <input
                  className={styles.input}
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              {error && <p className={styles.error}>{error}</p>}
              <button className={styles.submitBtn} type="submit" disabled={loading}>
                {loading ? 'Sending…' : 'Send reset link'}
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
