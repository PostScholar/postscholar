'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/config'
import styles from './VerifyEmailBanner.module.css'

function userNeedsVerification(user) {
  if (!user) return false
  if (user.needs_email_verification != null) {
    return user.needs_email_verification
  }
  return user.email_verified === false
}

export default function VerifyEmailBanner() {
  const { user, refreshUser } = useAuth()
  const didRefresh = useRef(false)

  useEffect(() => {
    if (!userNeedsVerification(user) || didRefresh.current) return
    didRefresh.current = true
    refreshUser()
  }, [user, refreshUser])

  if (!user || !userNeedsVerification(user)) return null

  async function handleResend() {
    try {
      await fetch(`${getApiUrl()}/auth/resend-verification`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // silent
    }
  }

  return (
    <div className={styles.banner} role="status">
      <p>
        Verify your email to post comments and start discussions.{' '}
        <Link href="/verify-email">Check your inbox</Link>
        {' · '}
        <button type="button" className={styles.resend} onClick={handleResend}>
          Resend email
        </button>
      </p>
    </div>
  )
}
