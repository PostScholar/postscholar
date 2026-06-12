'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/config'
import styles from './VerifyEmailBanner.module.css'

export default function VerifyEmailBanner() {
  const { user } = useAuth()

  if (!user || user.email_verified !== false) return null

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
