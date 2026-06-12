'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { discussionPath } from '@/lib/discussionSlug'
import { useAuth } from '@/context/AuthContext'
import { followUser, unfollowUser, getFollowStatus, getFollowCounts } from '@/lib/api'
import styles from './Profile.module.css'

function getInitials(profile) {
  const source = profile.display_name || profile.username || ''
  return source.slice(0, 2).toUpperCase()
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default function ProfileClient({ profile }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('discussions')
  const [following, setFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [counts, setCounts] = useState({ followers: 0, following: 0 })

  const isOwnProfile = profile.is_own_profile || (user && user.username === profile.username)
  const discussions = profile.discussions || []
  const comments = profile.comments || []
  const canViewActivity = profile.activity_visible || isOwnProfile

  useEffect(() => {
    async function fetchData() {
      try {
        const countsData = await getFollowCounts(profile.username)
        setCounts(countsData)
      } catch (err) {
        console.error('Failed to fetch follow counts:', err)
      }

      if (user && !isOwnProfile) {
        try {
          const statusData = await getFollowStatus(profile.username)
          setFollowing(statusData.following)
        } catch {
          // Optional — only available when session cookie is present
        }
      }
    }
    fetchData()
  }, [profile.username, user, isOwnProfile])

  async function handleFollowToggle() {
    if (!user) return
    setFollowLoading(true)
    try {
      if (following) {
        await unfollowUser(profile.username)
        setFollowing(false)
        setCounts(prev => ({ ...prev, followers: Math.max(0, prev.followers - 1) }))
      } else {
        await followUser(profile.username)
        setFollowing(true)
        setCounts(prev => ({ ...prev, followers: prev.followers + 1 }))
      }
    } catch (err) {
      alert(err.message)
    } finally {
      setFollowLoading(false)
    }
  }

  return (
    <div className={styles.page}>
      <Link href="/explore" className="backLink">← Discussions</Link>

      <div className={styles.header}>
        <div className={styles.avatar}>{getInitials(profile)}</div>
        <div className={styles.info}>
          <div className={styles.nameRow}>
            <div>
              <h1 className={styles.username}>
                {profile.display_name || profile.username}
              </h1>
              {profile.display_name && (
                <p className={styles.handle}>@{profile.username}</p>
              )}
            </div>
            {!isOwnProfile && user && (
              <button
                className={`${styles.followBtn} ${following ? styles.following : ''}`}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? '…' : following ? 'Following' : 'Follow'}
              </button>
            )}
            {isOwnProfile && (
              <Link href="/settings" className={styles.editLink}>Edit profile</Link>
            )}
          </div>

          {profile.affiliation && (
            <p className={styles.affiliation}>{profile.affiliation}</p>
          )}
          {profile.bio && <p className={styles.bio}>{profile.bio}</p>}

          {(profile.location || profile.website_url || profile.twitter_handle || profile.google_scholar_url || profile.orcid_id) && (
            <div className={styles.links}>
              {profile.location && <span className={styles.location}>{profile.location}</span>}
              {profile.website_url && (
                <a href={profile.website_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Website
                </a>
              )}
              {profile.twitter_handle && (
                <a
                  href={`https://twitter.com/${profile.twitter_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  @{profile.twitter_handle}
                </a>
              )}
              {profile.google_scholar_url && (
                <a href={profile.google_scholar_url} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  Google Scholar
                </a>
              )}
              {profile.orcid_id && (
                <a
                  href={`https://orcid.org/${profile.orcid_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.link}
                >
                  ORCID
                </a>
              )}
            </div>
          )}

          <div className={styles.meta}>
            {profile.joined_date && (
              <span className={styles.joined}>Joined {timeAgo(profile.joined_date)}</span>
            )}
            <Link href={`/u/${profile.username}/followers`} className={styles.countLink}>
              <strong>{counts.followers}</strong> follower{counts.followers !== 1 ? 's' : ''}
            </Link>
            <span className={styles.metaDot}>·</span>
            <Link href={`/u/${profile.username}/following`} className={styles.countLink}>
              <strong>{counts.following}</strong> following
            </Link>
          </div>
        </div>
      </div>

      {canViewActivity ? (
        <>
          <div className={styles.tabs}>
            <button
              className={`${styles.tab} ${activeTab === 'discussions' ? styles.active : ''}`}
              onClick={() => setActiveTab('discussions')}
            >
              Discussions
              <span className={styles.tabCount}>{discussions.length}</span>
            </button>
            <button
              className={`${styles.tab} ${activeTab === 'comments' ? styles.active : ''}`}
              onClick={() => setActiveTab('comments')}
            >
              Comments
              <span className={styles.tabCount}>{comments.length}</span>
            </button>
          </div>

          {activeTab === 'discussions' && (
            <div className={styles.activityList}>
              {discussions.length === 0 ? (
                <p className={styles.empty}>
                  {isOwnProfile
                    ? 'You haven\'t started any discussions yet.'
                    : 'No discussions started yet.'}
                </p>
              ) : (
                discussions.map(d => (
                  <Link
                    key={d.id}
                    href={discussionPath({ id: d.id, title: d.title })}
                    className={styles.activityCard}
                  >
                    <h3 className={`${styles.cardTitle} paper-title`}>{d.title}</h3>
                    <p className={styles.cardMeta}>
                      {[d.journal, d.year].filter(Boolean).join(' · ')}
                      {d.comment_count != null && (
                        <> · {d.comment_count} comment{d.comment_count !== 1 ? 's' : ''}</>
                      )}
                    </p>
                    <span className={styles.cardTime}>{timeAgo(d.created_at)}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className={styles.activityList}>
              {comments.length === 0 ? (
                <p className={styles.empty}>
                  {isOwnProfile
                    ? 'You haven\'t commented yet.'
                    : 'No comments yet.'}
                </p>
              ) : (
                comments.map(c => (
                  <Link
                    key={c.id}
                    href={discussionPath({
                      id: c.discussion_id,
                      title: c.paper_title,
                    })}
                    className={styles.activityCard}
                  >
                    <p className={styles.cardLabel}>Comment on</p>
                    <h3 className={`${styles.cardTitle} paper-title`}>{c.paper_title}</h3>
                    <p className={styles.cardBody}>
                      {c.body.length > 180 ? c.body.slice(0, 180) + '…' : c.body}
                    </p>
                    <span className={styles.cardTime}>{timeAgo(c.created_at)}</span>
                  </Link>
                ))
              )}
            </div>
          )}
        </>
      ) : (
        <div className={styles.privateNotice}>
          <p>This user has chosen to keep their activity private.</p>
        </div>
      )}
    </div>
  )
}
