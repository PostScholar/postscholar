import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Layout from '../components/Layout'
import styles from './Start.module.css'

/**
 * Start a discussion page — /start
 *
 * Flow:
 *   1. User pastes a DOI
 *   2. We fetch paper metadata from the backend (POST /papers/lookup)
 *   3. If found: show paper preview + opening comment textarea
 *   4. If not found: show manual entry form
 *   5. Submit creates the discussion and redirects to /d/:id
 *
 * Status: idle | loading | found | not_found | error
 */

const EMPTY_MANUAL = {
  title: '',
  authors: '',
  journal: '',
  year: '',
  abstract: '',
}

export default function Start() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [doi, setDoi] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | found | not_found | error
  const [paper, setPaper] = useState(null)
  const [discussionId, setDiscussionId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  const [manual, setManual] = useState(EMPTY_MANUAL)
  const [openingComment, setOpeningComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/login')
    return null
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!doi.trim()) return
    setStatus('loading')
    setErrorMsg('')
    setPaper(null)

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/papers/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doi: doi.trim() })
      })
      const data = await res.json()

      if (!res.ok) {
        setStatus('error')
        setErrorMsg(data.error || 'Something went wrong')
        return
      }

      if (!data.found) {
        setStatus('not_found')
        return
      }

      // Paper found — if discussion already existed, redirect immediately
      if (data.existed) {
        navigate(`/d/${data.discussion_id}`)
        return
      }

      setPaper(data.paper)
      setDiscussionId(data.discussion_id)
      setStatus('found')
    } catch (err) {
      setStatus('error')
      setErrorMsg('Failed to reach server')
    }
  }

  async function handleSubmitFound(e) {
    e.preventDefault()
    // Discussion already created by lookup — just redirect
    // Opening comment posting will be wired in E9
    navigate(`/d/${discussionId}`)
  }

  async function handleSubmitManual(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      // In E9: POST /papers/lookup with manual data
      // For now navigate to home
      navigate('/')
    } catch (err) {
      setErrorMsg('Failed to create discussion')
    } finally {
      setSubmitting(false)
    }
  }

  function formatAuthors(authors_json) {
    if (!authors_json?.length) return ''
    return authors_json.map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', ')
  }

  return (
    <Layout>
      <div className={styles.page}>
        <div className={styles.header}>
          <h1 className={styles.heading}>Start a discussion</h1>
          <p className={styles.subheading}>
            Paste a DOI to find the paper. If it isn't in CrossRef, you can enter it manually.
          </p>
        </div>

        {/* DOI lookup form */}
        <form className={styles.doiForm} onSubmit={handleLookup}>
          <div className={styles.doiRow}>
            <input
              className={styles.doiInput}
              type="text"
              placeholder="e.g. 10.1145/3290605.3300651"
              value={doi}
              onChange={e => setDoi(e.target.value)}
              disabled={status === 'loading' || status === 'found'}
            />
            <button
              type="submit"
              className={styles.lookupBtn}
              disabled={status === 'loading' || !doi.trim() || status === 'found'}
            >
              {status === 'loading' ? 'Looking up...' : 'Look up'}
            </button>
          </div>
        </form>

        {/* Error */}
        {status === 'error' && (
          <p className={styles.error}>{errorMsg}</p>
        )}

        {/* Found — paper preview */}
        {status === 'found' && paper && (
          <form className={styles.foundForm} onSubmit={handleSubmitFound}>
            <div className={styles.paperPreview}>
              <div className={styles.previewBadge}>Paper found</div>
              <h2 className={`${styles.previewTitle} paper-title`}>{paper.title}</h2>
              <div className={styles.previewMeta}>
                {formatAuthors(paper.authors_json) && (
                  <span>{formatAuthors(paper.authors_json)}</span>
                )}
                {paper.journal && <span>{paper.journal}</span>}
                {paper.year && <span>{paper.year}</span>}
              </div>
              {paper.abstract && (
                <p className={styles.previewAbstract}>{paper.abstract}</p>
              )}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Opening comment <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Share your thoughts on this paper to kick off the discussion..."
                value={openingComment}
                onChange={e => setOpeningComment(e.target.value)}
                rows={5}
              />
            </div>

            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setStatus('idle'); setPaper(null); setDoi('') }}
              >
                Start over
              </button>
              <button type="submit" className={styles.submitBtn}>
                Start discussion
              </button>
            </div>
          </form>
        )}

        {/* Not found — manual entry */}
        {status === 'not_found' && (
          <form className={styles.manualForm} onSubmit={handleSubmitManual}>
            <div className={styles.notFoundBanner}>
              This DOI wasn't found on CrossRef. Enter the paper details manually.
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Title <span className={styles.required}>*</span></label>
              <input
                className={styles.input}
                type="text"
                required
                value={manual.title}
                onChange={e => setManual(m => ({ ...m, title: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Authors</label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. Jane Smith, John Doe"
                value={manual.authors}
                onChange={e => setManual(m => ({ ...m, authors: e.target.value }))}
              />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Journal / venue</label>
                <input
                  className={styles.input}
                  type="text"
                  value={manual.journal}
                  onChange={e => setManual(m => ({ ...m, journal: e.target.value }))}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Year</label>
                <input
                  className={styles.input}
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                  value={manual.year}
                  onChange={e => setManual(m => ({ ...m, year: e.target.value }))}
                />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Abstract <span className={styles.optional}>(optional)</span></label>
              <textarea
                className={styles.textarea}
                rows={4}
                value={manual.abstract}
                onChange={e => setManual(m => ({ ...m, abstract: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                Opening comment <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Share your thoughts on this paper..."
                value={openingComment}
                onChange={e => setOpeningComment(e.target.value)}
                rows={4}
              />
            </div>

            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.formFooter}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => { setStatus('idle'); setDoi('') }}
              >
                Back
              </button>
              <button
                type="submit"
                className={styles.submitBtn}
                disabled={submitting}
              >
                {submitting ? 'Creating...' : 'Start discussion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}