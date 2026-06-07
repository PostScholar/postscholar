'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { searchDiscussions } from '@/lib/api'
import Layout from '@/components/Layout'
import FeedCard from '@/components/FeedCard'
import styles from './Search.module.css'

export default function SearchPage() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ''
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const doSearch = useCallback(async (query) => {
    if (!query.trim()) return setResults([])
    setLoading(true)
    try {
      const data = await searchDiscussions(query)
      setResults(data.results)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    doSearch(q)
  }, [q, doSearch])

  return (
    <Layout>
      <div className={styles.page}>
        {q && (
          <p className={styles.summary}>
            {loading
              ? 'Searching…'
              : `${results.length} result${results.length !== 1 ? 's' : ''} for "${q}"`}
          </p>
        )}

        <div className={styles.results}>
          {results.map(d => (
            <FeedCard key={d.id} discussion={d} />
          ))}
          {!loading && q && results.length === 0 && (
            <p className={styles.empty}>No discussions found for "{q}".</p>
          )}
          {!q && (
            <p className={styles.empty}>Use the search bar above to find discussions.</p>
          )}
        </div>
      </div>
    </Layout>
  )
}
