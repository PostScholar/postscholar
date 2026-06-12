'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import { AuthBrandPanel, SocialAuthButtons } from '@/components/AuthLayout'
import PasswordInput from '@/components/PasswordInput'
import styles from './Auth.module.css'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [password, setPassword] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const form = e.target
    try {
      await login(form.email.value, password)
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
            <h1 className={styles.title}>Sign in</h1>
            <p className={styles.subtitle}>Continue to your account</p>
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

            <div className={styles.labelRow}>
              <label className={styles.label} htmlFor="password">Password</label>
              <Link href="/forgot-password" className={styles.forgotLink}>
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              name="password"
              label=""
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />

            {error && <p className={styles.error}>{error}</p>}

            <button className={styles.submitBtn} type="submit" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </button>
          </form>

          <p className={styles.switchLink}>
            No account? <Link href="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
