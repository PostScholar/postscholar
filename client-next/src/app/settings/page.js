'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { updateProfile, getMyProfile } from '@/lib/api'
import Layout from '@/components/Layout'
import styles from './Settings.module.css'

export default function SettingsPage() {
  const { user, isLoading, refreshUser } = useAuth()
  const router = useRouter()
  const [bio, setBio] = useState('')
  const [affiliation, setAffiliation] = useState('')
  const [location, setLocation] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [twitterHandle, setTwitterHandle] = useState('')
  const [googleScholarUrl, setGoogleScholarUrl] = useState('')
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

  useEffect(() => {
    if (!user) return
    getMyProfile()
      .then(data => {
        setBio(data.bio || '')
        setAffiliation(data.affiliation || '')
        setLocation(data.location || '')
        setWebsiteUrl(data.website_url || '')
        setTwitterHandle(data.twitter_handle || '')
        setGoogleScholarUrl(data.google_scholar_url || '')
        if (data.profile_visibility) {
          setVisibility(data.profile_visibility)
        }
      })
      .catch(() => {})
  }, [user])

  async function handleSave() {
    setSaving(true)
    setError(null)
    try {
      await updateProfile({
        bio,
        affiliation,
        location,
        website_url: websiteUrl,
        twitter_handle: twitterHandle,
        google_scholar_url: googleScholarUrl,
        profile_visibility: visibility
      })
      await refreshUser()
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

          <div className={styles.field}>
            <label className={styles.label}>Affiliation</label>
            <input
              type="text"
              className={styles.input}
              value={affiliation}
              onChange={e => setAffiliation(e.target.value)}
              placeholder="University or Institution"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Location</label>
            <input
              type="text"
              className={styles.input}
              value={location}
              onChange={e => setLocation(e.target.value)}
              placeholder="City, Country"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Website</label>
            <input
              type="url"
              className={styles.input}
              value={websiteUrl}
              onChange={e => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Twitter Handle</label>
            <input
              type="text"
              className={styles.input}
              value={twitterHandle}
              onChange={e => setTwitterHandle(e.target.value)}
              placeholder="@username"
            />
          </div>

          <div className={styles.field}>
            <label className={styles.label}>Google Scholar</label>
            <input
              type="url"
              className={styles.input}
              value={googleScholarUrl}
              onChange={e => setGoogleScholarUrl(e.target.value)}
              placeholder="https://scholar.google.com/citations?user=..."
            />
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

        <section className={styles.section}>
          <h2 className={styles.sectionHeading}>Topics</h2>
          <p className={styles.sectionDesc}>
            Manage topics you follow to personalize your feed.
          </p>
          <Link href="/settings/topics" className={styles.topicsLink}>
            Manage followed topics →
          </Link>
        </section>
      </div>
    </Layout>
  )
}
