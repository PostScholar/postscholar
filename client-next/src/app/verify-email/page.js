'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/config'
import Logo from '@/components/Logo'
import styles from '../login/Auth.module.css'

function userNeedsVerification(user) {
  if (!user) return true
  if (user.needs_email_verification != null) {
    return user.needs_email_verification
  }
  return user.email_verified === false
}

function VerifyEmailInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, refreshUser } = useAuth()
  const [status, setStatus] = useState('pending')
  const [message, setMessage] = useState('')
  const [resending, setResending] = useState(false)

  const token = searchParams.get('token')
  const justSent = searchParams.get('sent') === '1'

  useEffect(() => {
    if (token || !user) return
    if (!userNeedsVerification(user)) {
      setStatus('success')
      setMessage('Your email is already verified.')
      setTimeout(() => router.push('/'), 2000)
    }
  }, [token, user, router])

  useEffect(() => {
    if (!token) return

    async function verify() {
      try {
        const res = await fetch(`${getApiUrl()}/auth/verify-email?token=${encodeURIComponent(token)}`)
        const data = await res.json()
        if (!res.ok) {
          setStatus('error')
          setMessage(data.error || 'Verification failed')
          return
        }
        setStatus('success')
        setMessage(
          data.message === 'Email already verified'
            ? 'Your email is already verified.'
            : 'Your email is verified. You can now post comments and start discussions.'
        )
        await refreshUser()
        setTimeout(() => router.push('/'), 3000)
      } catch {
        setStatus('error')
        setMessage('Failed to reach server')
      }
    }

    verify()
  }, [token, router, refreshUser])

  async function handleResend() {
    setResending(true)
    try {
      const res = await fetch(`${getApiUrl()}/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to resend')
      setMessage('Verification email sent. Check your inbox.')
    } catch (err) {
      setMessage(err.message)
    } finally {
      setResending(false)
    }
  }

  if (token) {
    return (
      <div className={styles.page}>
        <div className={styles.formPanel} style={{ width: '100%' }}>
          <div className={styles.card}>
            <Logo variant="full" href="/" className={styles.mobileLogo} />
            <h1 className={styles.title}>Verify email</h1>
            {status === 'pending' && <p className={styles.subtitle}>Verifying…</p>}
            {status === 'success' && <p className={styles.successBox}>{message}</p>}
            {status === 'error' && <p className={styles.error}>{message}</p>}
          </div>
        </div>
      </div>
    )
  }

  if (user && !userNeedsVerification(user)) {
    return (
      <div className={styles.page}>
        <div className={styles.formPanel} style={{ width: '100%' }}>
          <div className={styles.card}>
            <Logo variant="full" href="/" className={styles.mobileLogo} />
            <h1 className={styles.title}>Verify email</h1>
            <p className={styles.successBox}>Your email is already verified.</p>
            <p className={styles.switchLink}>
              <Link href="/">Continue browsing</Link>
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.page}>
      <div className={styles.formPanel} style={{ width: '100%' }}>
        <div className={styles.card}>
          <Logo variant="full" href="/" className={styles.mobileLogo} />
          <h1 className={styles.title}>Check your inbox</h1>
          <p className={styles.subtitle}>
            {justSent
              ? 'We sent a verification link to your email. Click it to unlock posting.'
              : 'Verify your email to post comments and start discussions.'}
          </p>
          {user?.email && (
            <p className={styles.hint}>Sent to {user.email}</p>
          )}
          {message && <p className={styles.successBox}>{message}</p>}
          <button
            className={styles.submitBtn}
            onClick={handleResend}
            disabled={resending}
            type="button"
          >
            {resending ? 'Sending…' : 'Resend verification email'}
          </button>
          <p className={styles.switchLink}>
            <Link href="/">Continue browsing</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className={styles.page} />}>
      <VerifyEmailInner />
    </Suspense>
  )
}
