'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { getApiUrl } from '@/lib/config'
import Logo from '@/components/Logo'
import { AuthBrandPanel, SocialAuthButtons } from '@/components/AuthLayout'
import PasswordInput from '@/components/PasswordInput'
import styles from '../login/Auth.module.css'

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

export default function Register() {
  const { refreshUser } = useAuth()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [fieldErrors, setFieldErrors] = useState({})

  function validate() {
    const errors = {}
    if (!USERNAME_REGEX.test(username)) {
      errors.username = '3–30 chars: lowercase letters, numbers, underscores'
    }
    if (password.length < 8) {
      errors.password = 'At least 8 characters'
    }
    if (!termsAccepted) {
      errors.terms = 'You must agree to the Terms and Privacy Policy'
    }
    setFieldErrors(errors)
    return Object.keys(errors).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    if (!validate()) return

    setLoading(true)
    const form = e.target
    try {
      const res = await fetch(`${getApiUrl()}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          email: form.email.value,
          username,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Registration failed')
      await refreshUser()
      router.push('/verify-email?sent=1')
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
            <h1 className={styles.title}>Create account</h1>
            <p className={styles.subtitle}>Join paper discussions</p>
          </div>

          <SocialAuthButtons />

          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                className={styles.input}
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="username">Username</label>
              <p className={styles.hint}>Lowercase letters, numbers, underscores. 3–30 characters.</p>
              <input
                className={`${styles.input} ${fieldErrors.username ? styles.inputError : ''}`}
                id="username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value.toLowerCase())}
                required
              />
              {fieldErrors.username && <p className={styles.error}>{fieldErrors.username}</p>}
            </div>

            <PasswordInput
              id="password"
              name="password"
              label="Password"
              hint="At least 8 characters."
              autoComplete="new-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
            {fieldErrors.password && <p className={styles.error}>{fieldErrors.password}</p>}

            <label className={styles.checkboxRow}>
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={e => setTermsAccepted(e.target.checked)}
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank">Terms of Service</Link>
                {' '}and{' '}
                <Link href="/privacy" target="_blank">Privacy Policy</Link>
              </span>
            </label>
            {fieldErrors.terms && <p className={styles.error}>{fieldErrors.terms}</p>}

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </button>
          </form>

          <p className={styles.switchLink}>
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
