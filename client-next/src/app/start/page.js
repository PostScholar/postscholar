'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import Layout from '@/components/Layout'
import { postComment } from '@/lib/api'
import { discussionPath } from '@/lib/discussionSlug'
import { getApiUrl } from '@/lib/config'
import styles from './Start.module.css'

/**
 * Start a discussion page — /start
 *
 * Two-step flow:
 *   1. POST /papers/lookup — fetches paper metadata only, no discussion created
 *   2. POST /discussions   — creates discussion with topics + custom tags on submit
 *
 * This ensures a discussion is only created when the user commits.
 */

const EMPTY_MANUAL = { doi: '', title: '', authors: '', journal: '', year: '', abstract: '', paper_url: '' }

const MANUAL_STATUSES = new Set(['not_found', 'lookup_failed', 'manual'])

function manualBannerMessage(status) {
  if (status === 'lookup_failed') {
    return 'CrossRef is unavailable — enter the paper details manually.'
  }
  if (status === 'not_found') {
    return "This DOI wasn't found on CrossRef. Enter the paper details manually."
  }
  return 'Enter the paper details to start a discussion.'
}

function TopicPicker({ allTopics, selectedTopicIds, toggleTopic }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        Topics <span className={styles.optional}>(optional)</span>
      </label>
      <p className={styles.hint}>Select any that apply.</p>
      <div className={styles.topicGrid}>
        {allTopics.map(parent => (
          <div key={parent.slug} className={styles.topicGroup}>
            <div className={styles.topicGroupLabel}>{parent.name}</div>
            <div className={styles.topicChips}>
              {(parent.children || []).map(child => (
                <button
                  key={child.id}
                  type="button"
                  className={`${styles.topicChip} ${selectedTopicIds.includes(child.id) ? styles.topicChipSelected : ''}`}
                  onClick={() => toggleTopic(child.id)}
                >
                  {child.name}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function CustomTagInput({ customTagInput, setCustomTagInput, parseCustomTags }) {
  return (
    <div className={styles.field}>
      <label className={styles.label}>
        Custom tags <span className={styles.optional}>(optional)</span>
      </label>
      <p className={styles.hint}>Comma-separated. e.g. transformer, few-shot learning, NLP</p>
      <input
        className={styles.input}
        type="text"
        placeholder="e.g. deep learning, transformers"
        value={customTagInput}
        onChange={e => setCustomTagInput(e.target.value)}
      />
      {parseCustomTags().length > 0 && (
        <div className={styles.tagPreview}>
          {parseCustomTags().map(tag => (
            <span key={tag} className={styles.tagPill}>{tag}</span>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Start() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  const [doi, setDoi] = useState('')
  const [status, setStatus] = useState('idle')
  const [paper, setPaper] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [manual, setManual] = useState(EMPTY_MANUAL)
  const [openingComment, setOpeningComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const [allTopics, setAllTopics] = useState([])
  const [selectedTopicIds, setSelectedTopicIds] = useState([])
  const [customTagInput, setCustomTagInput] = useState('')

  useEffect(() => {
    fetch(`${getApiUrl()}/topics`)
      .then(r => r.json())
      .then(data => setAllTopics(data.topics || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (isLoading) return
    if (!user) {
      router.replace('/login')
    }
  }, [user, isLoading, router])

  if (isLoading || !user) {
    return null
  }

  function parseCustomTags() {
    return customTagInput.split(',').map(t => t.trim().toLowerCase()).filter(t => t.length > 0)
  }

  function toggleTopic(id) {
    setSelectedTopicIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }

  function openManualForm(prefillDoi = true) {
    setManual(prev => ({
      ...EMPTY_MANUAL,
      doi: prefillDoi ? doi.trim() : '',
    }))
    setStatus('manual')
    setErrorMsg('')
    setPaper(null)
  }

  function resetToIdle() {
    setStatus('idle')
    setPaper(null)
    setDoi('')
    setManual(EMPTY_MANUAL)
    setOpeningComment('')
    setSelectedTopicIds([])
    setCustomTagInput('')
    setErrorMsg('')
  }

  async function handleLookup(e) {
    e.preventDefault()
    if (!doi.trim()) return
    setStatus('loading')
    setErrorMsg('')
    setPaper(null)
    setSelectedTopicIds([])
    setCustomTagInput('')

    try {
      const res = await fetch(`${getApiUrl()}/papers/lookup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ doi: doi.trim() })
      })
      const data = await res.json()

      if (!res.ok) { setStatus('error'); setErrorMsg(data.error || 'Something went wrong'); return }
      if (!data.found) {
        setManual(prev => ({ ...EMPTY_MANUAL, doi: doi.trim() }))
        setStatus(data.lookup_failed ? 'lookup_failed' : 'not_found')
        return
      }

      // If a discussion already exists for this paper, redirect immediately
      if (data.existed && data.discussion_id) {
        router.push(
          discussionPath({
            id: data.discussion_id,
            title: data.paper?.title,
          })
        )
        return
      }

      // Paper found or newly fetched — show form, do NOT create discussion yet
      setPaper(data.paper)
      setStatus('found')
    } catch {
      setStatus('error')
      setErrorMsg('Failed to reach server')
    }
  }

  async function handleSubmitFound(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      // Step 1: Create the discussion now that user has committed
      const discussionRes = await fetch(`${getApiUrl()}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paper_id: paper.id,
          topics: selectedTopicIds,
          custom_tags: parseCustomTags()
        })
      })
      const discussionData = await discussionRes.json()
      if (!discussionRes.ok) throw new Error(discussionData.error || 'Failed to create discussion')

      const discussion_id = discussionData.discussion_id

      // Step 2: Post opening comment if provided
      if (openingComment.trim()) {
        await postComment(discussion_id, openingComment.trim())
      }

      router.push(discussionPath({ id: discussion_id, title: paper.title }))
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  async function handleSubmitManual(e) {
    e.preventDefault()
    setSubmitting(true)
    setErrorMsg('')
    try {
      // First create the paper manually
      const paperRes = await fetch(`${getApiUrl()}/papers/manual`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: manual.title,
          authors: manual.authors,
          journal: manual.journal,
          year: manual.year ? parseInt(manual.year) : null,
          abstract: manual.abstract,
          doi: manual.doi?.trim() || null,
          paper_url: manual.paper_url?.trim() || null,
        })
      })
      const paperData = await paperRes.json()
      if (!paperRes.ok) throw new Error(paperData.error || 'Failed to create paper')

      // Then create the discussion
      const discussionRes = await fetch(`${getApiUrl()}/discussions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          paper_id: paperData.paper.id,
          topics: selectedTopicIds,
          custom_tags: parseCustomTags()
        })
      })
      const discussionData = await discussionRes.json()
      if (!discussionRes.ok) throw new Error(discussionData.error || 'Failed to create discussion')

      if (openingComment.trim()) {
        await postComment(discussionData.discussion_id, openingComment.trim())
      }

      router.push(
        discussionPath({
          id: discussionData.discussion_id,
          title: manual.title || paperData.paper?.title,
        })
      )
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function formatAuthors(authors_json) {
    if (!authors_json?.length) return ''
    return authors_json.map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', ')
  }

  const showManualForm = MANUAL_STATUSES.has(status)
  const doiFormDisabled = status === 'loading' || status === 'found'

  return (
    <Layout>
      <div className={styles.page}>
        <Link href="/explore" className="backLink">← Discussions</Link>
        <div className={styles.intro}>
          <h1 className={styles.heading}>Start a discussion</h1>
          <p className={styles.description}>
            Paste a DOI to find a published paper. PostScholar will fetch the title,
            authors, and abstract from CrossRef. If the paper already has a discussion,
            you will be taken there instead.
          </p>
        </div>

        {/* DOI lookup */}
        <form className={styles.doiForm} onSubmit={handleLookup}>
          <div className={styles.doiRow}>
            <input
              className={styles.doiInput}
              type="text"
              placeholder="e.g. 10.1145/3290605.3300651"
              value={doi}
              onChange={e => setDoi(e.target.value)}
              disabled={doiFormDisabled}
            />
            <button
              type="submit"
              className={styles.lookupBtn}
              disabled={status === 'loading' || !doi.trim() || status === 'found'}
            >
              {status === 'loading' ? 'Looking up...' : 'Look up'}
            </button>
          </div>
          <p className={styles.hint}>
            Example: <code className={styles.code}>10.1038/nature14539</code>
          </p>
          {!showManualForm && status !== 'found' && (
            <p className={styles.hint}>
              <button type="button" className={styles.manualLink} onClick={() => openManualForm(false)}>
                Paper not on CrossRef? Enter details manually
              </button>
            </p>
          )}
        </form>

        {status === 'error' && !showManualForm && <p className={styles.error}>{errorMsg}</p>}

        {/* Found — paper preview + tagging */}
        {status === 'found' && paper && (
          <form className={styles.foundForm} onSubmit={handleSubmitFound}>
            <div className={styles.paperPreview}>
              <div className={styles.previewBadge}>Paper found</div>
              <h2 className={`${styles.previewTitle} paper-title`}>{paper.title}</h2>
              <div className={styles.previewMeta}>
                {formatAuthors(paper.authors_json) && <span>{formatAuthors(paper.authors_json)}</span>}
                {paper.journal && <span>{paper.journal}</span>}
                {paper.year && <span>{paper.year}</span>}
              </div>
              {paper.abstract && <p className={styles.previewAbstract}>{paper.abstract}</p>}
            </div>

            <TopicPicker
              allTopics={allTopics}
              selectedTopicIds={selectedTopicIds}
              toggleTopic={toggleTopic}
            />

            <CustomTagInput
              customTagInput={customTagInput}
              setCustomTagInput={setCustomTagInput}
              parseCustomTags={parseCustomTags}
            />

            <div className={styles.field}>
              <label className={styles.label}>
                Opening comment <span className={styles.optional}>(optional)</span>
              </label>
              <textarea
                className={styles.textarea}
                placeholder="Share your thoughts to kick off the discussion..."
                value={openingComment}
                onChange={e => setOpeningComment(e.target.value)}
                rows={5}
              />
            </div>

            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.formFooter}>
              <button type="button" className={styles.cancelBtn} onClick={resetToIdle}>
                Start over
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Starting...' : 'Start discussion'}
              </button>
            </div>
          </form>
        )}

        {/* Manual entry — not found, lookup failed, or user chose manual */}
        {showManualForm && (
          <form className={styles.manualForm} onSubmit={handleSubmitManual}>
            <div className={styles.notFoundBanner}>
              {manualBannerMessage(status)}
            </div>

            <div className={styles.field}>
              <label className={styles.label}>DOI <span className={styles.optional}>(optional)</span></label>
              <input
                className={styles.input}
                type="text"
                placeholder="e.g. 10.1038/nature14539"
                value={manual.doi}
                onChange={e => setManual(m => ({ ...m, doi: e.target.value }))}
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Paper link <span className={styles.optional}>(optional)</span></label>
              <input
                className={styles.input}
                type="url"
                placeholder="https://arxiv.org/abs/..."
                value={manual.paper_url}
                onChange={e => setManual(m => ({ ...m, paper_url: e.target.value }))}
              />
              <p className={styles.hint}>arXiv, publisher page, or PDF link</p>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Title <span className={styles.required}>*</span></label>
              <input className={styles.input} type="text" required
                value={manual.title} onChange={e => setManual(m => ({ ...m, title: e.target.value }))} />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Authors</label>
              <input className={styles.input} type="text" placeholder="e.g. Jane Smith, John Doe"
                value={manual.authors} onChange={e => setManual(m => ({ ...m, authors: e.target.value }))} />
            </div>

            <div className={styles.twoCol}>
              <div className={styles.field}>
                <label className={styles.label}>Journal / venue</label>
                <input className={styles.input} type="text"
                  value={manual.journal} onChange={e => setManual(m => ({ ...m, journal: e.target.value }))} />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Year</label>
                <input className={styles.input} type="number" min="1900" max={new Date().getFullYear()}
                  value={manual.year} onChange={e => setManual(m => ({ ...m, year: e.target.value }))} />
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Abstract <span className={styles.optional}>(optional)</span></label>
              <textarea className={styles.textarea} rows={4}
                value={manual.abstract} onChange={e => setManual(m => ({ ...m, abstract: e.target.value }))} />
            </div>

            <TopicPicker
              allTopics={allTopics}
              selectedTopicIds={selectedTopicIds}
              toggleTopic={toggleTopic}
            />

            <CustomTagInput
              customTagInput={customTagInput}
              setCustomTagInput={setCustomTagInput}
              parseCustomTags={parseCustomTags}
            />

            <div className={styles.field}>
              <label className={styles.label}>Opening comment <span className={styles.optional}>(optional)</span></label>
              <textarea className={styles.textarea} rows={4}
                placeholder="Share your thoughts..."
                value={openingComment} onChange={e => setOpeningComment(e.target.value)} />
            </div>

            {errorMsg && <p className={styles.error}>{errorMsg}</p>}

            <div className={styles.formFooter}>
              <button type="button" className={styles.cancelBtn} onClick={resetToIdle}>Back</button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Creating...' : 'Start discussion'}
              </button>
            </div>
          </form>
        )}
      </div>
    </Layout>
  )
}