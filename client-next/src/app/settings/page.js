'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateProfile } from '@/lib/api'
import Layout from '@/components/Layout'
import styles from './Settings.module.css'

export default function SettingsPage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [visibility, setVisibility] = useState({
    bio: true,
    joined_date: true,
    activity: true
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!isLoading && !user) router.replace('/login')
  }, [user, isLoading, router])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateProfile({ bio, profile_visibility: visibility })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (isLoading || !user) return null

  return (
    <Layout>
      <div className={styles.page}>
        <Link href={`/u/${user.username}`} className="backLink">← Profile</Link>
        <h1 className={styles.heading}>Settings</h1>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Profile</h2>

          <div className={styles.field}>
            <label className={styles.label}>Bio</label>
            <textarea
              className={styles.textarea}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder="A short bio about yourself"
              rows={3}
              maxLength={280}
            />
            <span className={styles.hint}>{bio.length}/280</span>
          </div>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Visibility</h2>
          <p className={styles.sectionDesc}>Choose what others can see on your profile.</p>

          {[
            { key: 'bio', label: 'Bio' },
            { key: 'joined_date', label: 'Join date' },
            { key: 'activity', label: 'Discussions and comments' },
          ].map(({ key, label }) => (
            <label key={key} className={styles.toggle}>
              <input
                type="checkbox"
                checked={visibility[key]}
                onChange={e => setVisibility(v => ({ ...v, [key]: e.target.checked }))}
              />
              <span>{label}</span>
            </label>
          ))}
        </section>

        {error && <p className={styles.error}>{error}</p>}

        <button
          className={styles.saveBtn}
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving…' : saved ? 'Saved' : 'Save changes'}
        </button>
      </div>
    </Layout>
  )
}
