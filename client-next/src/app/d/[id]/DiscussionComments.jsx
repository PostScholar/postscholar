'use client'

import { useState, useEffect } from 'react'
import CommentThread from '@/components/CommentThread'
import { getComments, searchComments, trackView } from '@/lib/api'
import styles from './Discussion.module.css'

export default function DiscussionComments({ discussionId }) {
  const [comments, setComments] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [commentSort, setCommentSort] = useState('oldest')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState(null)
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    trackView(discussionId).catch(() => {})
    load(true)
  }, [discussionId, commentSort])

  async function load(reset = false, cursor = null) {
    if (reset) setLoading(true)
    setError('')
    try {
      const commentsRes = await getComments(discussionId, cursor, commentSort)

      if (reset) {
        setComments(commentsRes.comments)
      } else {
        setComments(prev => [...prev, ...commentsRes.comments])
      }
      setNextCursor(commentsRes.next_cursor)
    } catch (err) {
      setError('Failed to load comments')
    } finally {
      setLoading(false)
    }
  }

  async function loadMore() {
    if (!nextCursor) return
    await load(false, nextCursor)
  }

  async function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) {
      setSearchResults(null)
      return
    }
    setSearching(true)
    try {
      const data = await searchComments(discussionId, searchQuery)
      setSearchResults(data.results)
    } catch {
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  function clearSearch() {
    setSearchQuery('')
    setSearchResults(null)
  }

  function highlight(text, query) {
    if (!query) return text
    const parts = text.split(new RegExp(`(${query})`, 'gi'))
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase()
        ? <mark key={i}>{part}</mark>
        : part
    )
  }

  if (loading) return <p className={styles.loading}>Loading comments...</p>
  if (error) return <p className={styles.error}>{error}</p>

  return (
    <>
      <form onSubmit={handleSearch} className={styles.searchForm}>
        <input
          className={styles.searchInput}
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          placeholder="Search comments…"
        />
        {searchQuery && (
          <button type="button" onClick={clearSearch} className={styles.clearBtn}>✕</button>
        )}
        <button type="submit" className={styles.searchBtn}>Search</button>
      </form>

      {searchResults !== null && (
        <div className={styles.searchResults}>
          {searching && <p className={styles.searchMeta}>Searching…</p>}
          {!searching && searchResults.length === 0 && (
            <p className={styles.searchMeta}>No comments found for "{searchQuery}".</p>
          )}
          {!searching && searchResults.map(r => (
            <div key={r.id} className={styles.searchResult}>
              <p className={styles.searchResultBody}>
                {highlight(r.body.length > 200 ? r.body.slice(0, 200) + '…' : r.body, searchQuery)}
              </p>
              <span className={styles.searchResultMeta}>{r.username}</span>
            </div>
          ))}
        </div>
      )}

      {searchResults === null && (
        <CommentThread
          discussionId={discussionId}
          comments={comments}
          setComments={setComments}
          nextCursor={nextCursor}
          onLoadMore={loadMore}
          onSortChange={setCommentSort}
          currentSort={commentSort}
        />
      )}
    </>
  )
}