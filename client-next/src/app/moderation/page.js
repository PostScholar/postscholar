'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { getReports, updateReportStatus } from '@/lib/api'
import Layout from '@/components/Layout'
import styles from './Moderation.module.css'

const STATUS_OPTIONS = ['pending', 'reviewed', 'actioned', 'dismissed']

const REASON_LABELS = {
  spam: 'Spam',
  harassment: 'Harassment',
  offtopic: 'Off-topic',
  misinformation: 'Misinformation',
  other: 'Other',
}

function timeAgo(isoString) {
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  return `${days}d ago`
}

function isModerator(user) {
  return user?.role === 'moderator' || user?.role === 'admin'
}

export default function ModerationPage() {
  const { user, isLoading: authLoading } = useAuth()
  const router = useRouter()
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('pending')
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.replace('/login')
      return
    }
    if (!isModerator(user)) {
      router.replace('/explore')
      return
    }
    loadReports()
  }, [user, authLoading, status, router])

  async function loadReports() {
    setLoading(true)
    try {
      const data = await getReports(status)
      setReports(data.reports || [])
    } catch (err) {
      console.error('Failed to load reports:', err)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  async function handleStatusChange(reportId, newStatus) {
    setActionLoading(reportId)
    try {
      await updateReportStatus(reportId, newStatus)
      setReports(prev => prev.filter(r => r.id !== reportId))
    } catch (err) {
      alert(err.message || 'Failed to update report')
    } finally {
      setActionLoading(null)
    }
  }

  if (authLoading || !user || !isModerator(user)) {
    return (
      <Layout>
        <p className={styles.loading}>Loading…</p>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.heading}>Moderation</h1>
        <p className={styles.subheading}>Review reported comments and discussions.</p>

        <div className={styles.filters}>
          {STATUS_OPTIONS.map(s => (
            <button
              key={s}
              type="button"
              className={`${styles.filterBtn} ${status === s ? styles.active : ''}`}
              onClick={() => setStatus(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>

        {loading ? (
          <p className={styles.loading}>Loading reports…</p>
        ) : reports.length === 0 ? (
          <p className={styles.empty}>No {status} reports.</p>
        ) : (
          <div className={styles.list}>
            {reports.map(report => (
              <article key={report.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <span className={styles.reason}>
                    {REASON_LABELS[report.reason] || report.reason}
                  </span>
                  <span className={styles.time}>{timeAgo(report.created_at)}</span>
                </div>

                <p className={styles.meta}>
                  Reported by{' '}
                  <Link href={`/u/${report.reporter_username}`} className={styles.link}>
                    @{report.reporter_username}
                  </Link>
                  {report.comment_author && (
                    <>
                      {' · '}Comment by{' '}
                      <Link href={`/u/${report.comment_author}`} className={styles.link}>
                        @{report.comment_author}
                      </Link>
                    </>
                  )}
                </p>

                {report.description && (
                  <p className={styles.description}>{report.description}</p>
                )}

                {report.comment_body && (
                  <blockquote className={styles.quote}>
                    {report.comment_body.length > 300
                      ? report.comment_body.slice(0, 300) + '…'
                      : report.comment_body}
                  </blockquote>
                )}

                {report.discussion_id && (
                  <Link href={`/d/${report.discussion_id}`} className={styles.discussionLink}>
                    View discussion →
                  </Link>
                )}

                {status === 'pending' && (
                  <div className={styles.actions}>
                    <button
                      type="button"
                      className={styles.actionBtn}
                      disabled={actionLoading === report.id}
                      onClick={() => handleStatusChange(report.id, 'reviewed')}
                    >
                      Mark reviewed
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionPrimary}`}
                      disabled={actionLoading === report.id}
                      onClick={() => handleStatusChange(report.id, 'actioned')}
                    >
                      Action taken
                    </button>
                    <button
                      type="button"
                      className={`${styles.actionBtn} ${styles.actionMuted}`}
                      disabled={actionLoading === report.id}
                      onClick={() => handleStatusChange(report.id, 'dismissed')}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>
    </Layout>
  )
}
