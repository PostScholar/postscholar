'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { getApiUrl } from '@/lib/config'
import {
  getConnections,
  unlinkConnection,
  setConnectionPassword,
} from '@/lib/api'
import styles from './LinkedAccounts.module.css'

const LINK_URLS = {
  google: '/auth/google/link/url',
  github: '/auth/github/link/url',
  orcid: '/auth/orcid/link/url',
}

const PROVIDER_HINTS = {
  google: 'Sign in with your Google account',
  github: 'Sign in with your GitHub account',
  orcid: 'Connect your ORCID iD',
  password: 'Sign in with email and password',
}

function ProviderIcon({ provider }) {
  const labels = {
    password: '✉',
    google: 'G',
    github: 'GH',
    orcid: 'ID',
  }
  return (
    <span className={`${styles.providerIcon} ${styles[`icon_${provider}`]}`}>
      {labels[provider]}
    </span>
  )
}

export default function LinkedAccounts() {
  const searchParams = useSearchParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const [linking, setLinking] = useState(null)
  const [unlinking, setUnlinking] = useState(null)
  const [showPasswordForm, setShowPasswordForm] = useState(false)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [settingPassword, setSettingPassword] = useState(false)
  const [linkedNotice, setLinkedNotice] = useState(null)

  const load = useCallback(async () => {
    setError(null)
    try {
      const result = await getConnections()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    const linked = searchParams.get('linked')
    if (linked) {
      setLinkedNotice(`${linked.charAt(0).toUpperCase()}${linked.slice(1)} connected successfully.`)
      const t = setTimeout(() => setLinkedNotice(null), 4000)
      return () => clearTimeout(t)
    }
  }, [searchParams])

  async function handleLink(provider) {
    const path = LINK_URLS[provider]
    if (!path) return

    setLinking(provider)
    setActionError(null)
    try {
      const res = await fetch(`${getApiUrl()}${path}`, { credentials: 'include' })
      const body = await res.json()
      if (!res.ok) throw new Error(body.error || 'Could not start connection')
      window.location.href = body.url
    } catch (err) {
      setActionError(err.message)
      setLinking(null)
    }
  }

  async function handleUnlink(provider) {
    const conn = data?.connections?.find(c => c.provider === provider)
    if (!conn?.can_unlink) return

    const label = conn.label
    if (!window.confirm(`Disconnect ${label}? You can reconnect it later.`)) return

    setUnlinking(provider)
    setActionError(null)
    try {
      const result = await unlinkConnection(provider)
      setData(result)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setUnlinking(null)
    }
  }

  async function handleSetPassword(e) {
    e.preventDefault()
    if (password.length < 8) {
      setActionError('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      setActionError('Passwords do not match')
      return
    }

    setSettingPassword(true)
    setActionError(null)
    try {
      const result = await setConnectionPassword(password)
      setData(result)
      setPassword('')
      setConfirmPassword('')
      setShowPasswordForm(false)
    } catch (err) {
      setActionError(err.message)
    } finally {
      setSettingPassword(false)
    }
  }

  if (loading) {
    return <p className={styles.muted}>Loading sign-in methods…</p>
  }

  if (error) {
    return <p className={styles.error}>{error}</p>
  }

  const singleMethod = data?.sign_in_method_count === 1

  return (
    <div className={styles.wrap}>
      <p className={styles.intro}>
        Manage how you sign in to PostScholar. Keep at least one method connected
        so you never lose access to your account.
      </p>

      {linkedNotice && <p className={styles.success}>{linkedNotice}</p>}
      {actionError && <p className={styles.error}>{actionError}</p>}
      {singleMethod && (
        <p className={styles.warning}>
          This is your only sign-in method. Connect another before disconnecting this one.
        </p>
      )}

      <ul className={styles.list}>
        {data.connections.map(conn => (
          <li key={conn.provider} className={styles.row}>
            <div className={styles.rowMain}>
              <ProviderIcon provider={conn.provider} />
              <div className={styles.rowText}>
                <span className={styles.rowLabel}>{conn.label}</span>
                {conn.linked ? (
                  <span className={styles.rowDetail}>
                    {conn.detail || 'Connected'}
                    {conn.verified === true && (
                      <span className={styles.verifiedBadge}>Verified</span>
                    )}
                    {conn.verified === false && (
                      <span className={styles.unverifiedBadge}>Unverified</span>
                    )}
                  </span>
                ) : (
                  <span className={styles.rowHint}>{PROVIDER_HINTS[conn.provider]}</span>
                )}
              </div>
            </div>

            <div className={styles.rowActions}>
              {conn.linked ? (
                <>
                  <span className={styles.connectedBadge}>Connected</span>
                  {conn.can_unlink ? (
                    <button
                      type="button"
                      className={styles.unlinkBtn}
                      onClick={() => handleUnlink(conn.provider)}
                      disabled={unlinking === conn.provider}
                    >
                      {unlinking === conn.provider ? 'Removing…' : 'Disconnect'}
                    </button>
                  ) : (
                    <span className={styles.lockedHint} title="Add another sign-in method first">
                      Required
                    </span>
                  )}
                </>
              ) : conn.provider === 'password' ? (
                conn.needs_email_for_password ? (
                  <span className={styles.lockedHint}>
                    Link an account with email first
                  </span>
                ) : (
                  <button
                    type="button"
                    className={styles.linkBtn}
                    onClick={() => setShowPasswordForm(v => !v)}
                  >
                    {showPasswordForm ? 'Cancel' : 'Set password'}
                  </button>
                )
              ) : (
                <button
                  type="button"
                  className={styles.linkBtn}
                  onClick={() => handleLink(conn.provider)}
                  disabled={linking === conn.provider}
                >
                  {linking === conn.provider ? 'Redirecting…' : 'Connect'}
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      {showPasswordForm && (
        <form className={styles.passwordForm} onSubmit={handleSetPassword}>
          <p className={styles.passwordIntro}>
            Add a password for <strong>{data.email}</strong>. You can still use your
            other connected sign-in methods.
          </p>
          <div className={styles.passwordFields}>
            <input
              type="password"
              className={styles.passwordInput}
              placeholder="New password (min. 8 characters)"
              value={password}
              onChange={e => setPassword(e.target.value)}
              minLength={8}
              autoComplete="new-password"
              required
            />
            <input
              type="password"
              className={styles.passwordInput}
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
            <button
              type="submit"
              className={styles.savePasswordBtn}
              disabled={settingPassword}
            >
              {settingPassword ? 'Saving…' : 'Save password'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
