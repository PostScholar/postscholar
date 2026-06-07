'use client'

import { useState } from 'react'
import Link from 'next/link'
import styles from './Profile.module.css'

function getInitials(username) {
  return username.slice(0, 2).toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diff / 86400000)
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 30) return `${days} days ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  if (months < 12) return `${months} months ago`
  return `${Math.floor(months / 12)} years ago`
}

export default function ProfileClient({ profile }) {
  const [activeTab, setActiveTab] = useState('discussions')

  return (
    <div className={styles.page}>
      <Link href="/explore" className="backLink">← Discussions</Link>
      <div className={styles.header}>
        <div className={styles.avatar}>
          {getInitials(profile.username)}
        </div>
        <div className={styles.info}>
          <h1 className={styles.username}>{profile.username}</h1>
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
          {profile.joined_date && (
            <p className={styles.joined}>Joined {timeAgo(profile.joined_date)}</p>
          )}
        </div>
      </div>

      {(profile.discussions || profile.comments) && (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`}
              onClick={() => setActiveTab('discussions')}
            >
              Discussions
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
            </button>
          </div>

          {activeTab === 'discussions' && (
            <div className={styles.list}>
              {profile.discussions?.length === 0 && (
                <p className={styles.empty}>No discussions started yet.</p>
              )}
              {profile.discussions?.map(d => (
                <Link key={d.id} href={`/d/${d.id}`} className={styles.item}>
                  <span className={styles.itemTitle}>{d.title}</span>
                  <span className={styles.itemMeta}>
                    {d.journal} · {d.year} · {d.comment_count} comment{d.comment_count !== 1 ? 's' : ''}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className={styles.list}>
              {profile.comments?.length === 0 && (
                <p className={styles.empty}>No comments yet.</p>
              )}
              {profile.comments?.map(c => (
                <Link key={c.id} href={`/d/${c.discussion_id}`} className={styles.item}>
                  <span className={styles.itemTitle}>{c.paper_title}</span>
                  <span className={styles.itemBody}>
                    {c.body.length > 120 ? c.body.slice(0, 120) + '…' : c.body}
                  </span>
                  <span className={styles.itemMeta}>{timeAgo(c.created_at)}</span>
                </Link>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
