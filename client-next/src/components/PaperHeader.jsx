'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bookmark, Quote } from 'lucide-react'
import styles from './PaperHeader.module.css'
import { createBookmark, removeBookmark, checkBookmark } from '@/lib/api'
import { useAuth } from '@/context/AuthContext'

/**
 * PaperHeader
 *
 * Displays paper title, authors, journal/year, collapsible abstract,
 * custom tags, and who started the discussion + when.
 */

function formatAuthors(authors) {
  if (!authors || authors.length === 0) return ''
  return authors.map(a => [a.given, a.family].filter(Boolean).join(' ')).join(', ')
}

function timeAgo(isoString) {
  if (!isoString) return ''
  const diff = Date.now() - new Date(isoString).getTime()
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 30) return `${days}d ago`
  return new Date(isoString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatCitation(paper, format) {
  const authors = paper.authors_json || []
  const authorStr = formatAuthors(authors)
  const year = paper.year || 'n.d.'
  const title = paper.title || 'Untitled'
  const journal = paper.journal || ''
  const doi = paper.doi || ''

  if (format === 'apa') {
    return `${authorStr} (${year}). ${title}. ${journal ? `${journal}. ` : ''}${doi ? `https://doi.org/${doi}` : ''}`
  } else if (format === 'mla') {
    return `${authorStr}. "${title}" ${journal ? `${journal}, ` : ''}${year}${doi ? `. https://doi.org/${doi}` : '.'}`
  } else if (format === 'chicago') {
    return `${authorStr}. "${title}." ${journal ? `${journal} ` : ''}(${year})${doi ? `. https://doi.org/${doi}` : '.'}`
  } else if (format === 'bibtex') {
    const key = authors[0]?.family?.toLowerCase() || 'paper'
    return `@article{${key}${year},
  author = {${authorStr}},
  title = {${title}},
  ${journal ? `journal = {${journal}},\n  ` : ''}year = {${year}}${doi ? `,\n  doi = {${doi}}` : ''}
}`
  }
  return ''
}

export default function PaperHeader({ paper, startedBy, discussionCreatedAt, customTags = [], discussionId }) {
  const { user } = useAuth()
  const [bookmarked, setBookmarked] = useState(false)
  const [bookmarkLoading, setBookmarkLoading] = useState(false)
  const [citeMenuOpen, setCiteMenuOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const citeMenuRef = useRef(null)

  useEffect(() => {
    if (user && discussionId) {
      checkBookmark(discussionId)
        .then(data => setBookmarked(data.bookmarked))
        .catch(() => {})
    }
  }, [discussionId, user])

  useEffect(() => {
    function handleClickOutside(e) {
      if (citeMenuRef.current && !citeMenuRef.current.contains(e.target)) {
        setCiteMenuOpen(false)
      }
    }
    if (citeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [citeMenuOpen])

  async function toggleBookmark() {
    if (!user || bookmarkLoading || !discussionId) return

    setBookmarkLoading(true)
    try {
      if (bookmarked) {
        await removeBookmark(discussionId)
        setBookmarked(false)
      } else {
        await createBookmark(discussionId)
        setBookmarked(true)
      }
    } catch (err) {
      console.error('Bookmark error:', err)
    } finally {
      setBookmarkLoading(false)
    }
  }

  async function copyCitation(format) {
    const citation = formatCitation(paper, format)
    try {
      await navigator.clipboard.writeText(citation)
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
        setCiteMenuOpen(false)
      }, 1500)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className={styles.header}>
      {/* Source badge */}
      <div className={styles.sourceBadge}>
        {paper.source === 'crossref' ? 'Via CrossRef' : 'Manual entry'}
      </div>

      {/* Title and action buttons */}
      <div className={styles.titleRow}>
        <h1 className={`${styles.title} paper-title`}>{paper.title}</h1>
        <div className={styles.actionButtons}>
          <div className={styles.citeDropdown} ref={citeMenuRef}>
            <button
              onClick={() => setCiteMenuOpen(!citeMenuOpen)}
              className={styles.citeBtn}
              aria-label="Cite this paper"
            >
              <Quote size={20} />
            </button>
            {citeMenuOpen && (
              <div className={styles.citeMenu}>
                {copied ? (
                  <div className={styles.copiedMessage}>Copied!</div>
                ) : (
                  <>
                    <button onClick={() => copyCitation('apa')} className={styles.citeOption}>
                      APA
                    </button>
                    <button onClick={() => copyCitation('mla')} className={styles.citeOption}>
                      MLA
                    </button>
                    <button onClick={() => copyCitation('chicago')} className={styles.citeOption}>
                      Chicago
                    </button>
                    <button onClick={() => copyCitation('bibtex')} className={styles.citeOption}>
                      BibTeX
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          {user && discussionId && (
            <button
              onClick={toggleBookmark}
              className={`${styles.bookmarkBtn} ${bookmarked ? styles.bookmarked : ''}`}
              disabled={bookmarkLoading}
              aria-label={bookmarked ? 'Remove bookmark' : 'Bookmark discussion'}
            >
              <Bookmark size={20} fill={bookmarked ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>

      {/* Authors */}
      {paper.authors_json?.length > 0 && (
        <p className={styles.authors}>{formatAuthors(paper.authors_json)}</p>
      )}

      {/* Journal + year + DOI */}
      <div className={styles.meta}>
        {paper.journal && <span>{paper.journal}</span>}
        {paper.year && <span>{paper.year}</span>}
        {paper.doi && (
          <a
            href={`https://doi.org/${paper.doi}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.doiLink}
          >
            {paper.doi}
          </a>
        )}
      </div>

      {/* Custom tags */}
      {customTags.length > 0 && (
        <div className={styles.tags}>
          {customTags.map(tag => (
            <span key={tag} className={styles.tag}>{tag}</span>
          ))}
        </div>
      )}

      {/* Who started the discussion */}
      {startedBy && (
        <p className={styles.startedBy}>
          Discussion started by <Link href={`/u/${startedBy}`} className={styles.startedByLink}>{startedBy}</Link>
          {discussionCreatedAt && <> · {timeAgo(discussionCreatedAt)}</>}
        </p>
      )}
    </div>
  )
}