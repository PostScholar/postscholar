'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import styles from './DeleteAccount.module.css'

export default function DeleteAccountPage() {
  const router = useRouter()
  const { user, isLoading, logout } = useAuth()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [user, isLoading, router])

  const handleDelete = async (e) => {
    e.preventDefault()
    setError('')

    if (confirmation !== 'DELETE MY ACCOUNT') {
      setError('You must type "DELETE MY ACCOUNT" exactly to confirm')
      return
    }

    setLoading(true)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ password, confirmation })
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.code === 'PASSWORD_REQUIRED') {
          setError('Please enter your password to confirm deletion')
        } else if (data.code === 'INVALID_PASSWORD') {
          setError('Incorrect password')
        } else {
          setError(data.error || 'Failed to delete account')
        }
        setLoading(false)
        return
      }

      logout()
      router.push('/?deleted=true')
    } catch (err) {
      setError('Network error. Please try again.')
      setLoading(false)
    }
  }

  if (isLoading || !user) return null

  return (
    <Layout>
      <div className={styles.container}>
        <h1 className={styles.heading}>Delete Your Account</h1>

        <div className={styles.warning}>
          <h2 className={styles.warningTitle}>⚠️ Warning: This cannot be undone</h2>
          <ul className={styles.warningList}>
            <li>Your account will be permanently deleted</li>
            <li>Your comments and discussions will remain visible but anonymized</li>
            <li>You will lose access to all your data</li>
            <li>This action is irreversible</li>
          </ul>
        </div>

        <form onSubmit={handleDelete} className={styles.form}>
          <div className={styles.field}>
            <label htmlFor="password" className={styles.label}>
              Your Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.input}
              placeholder="Enter your password to confirm"
            />
          </div>

          <div className={styles.field}>
            <label htmlFor="confirmation" className={styles.label}>
              Type "DELETE MY ACCOUNT" to confirm
            </label>
            <input
              type="text"
              id="confirmation"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={styles.input}
              placeholder="DELETE MY ACCOUNT"
              required
            />
          </div>

          {error && (
            <div className={styles.error}>
              {error}
            </div>
          )}

          <div className={styles.actions}>
            <button
              type="button"
              onClick={() => router.back()}
              className={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.deleteButton}
              disabled={loading || confirmation !== 'DELETE MY ACCOUNT'}
            >
              {loading ? 'Deleting...' : 'Delete My Account'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  )
}
