'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'
import styles from './ShareButton.module.css'

export default function ShareButton({ url, title, className = '', size = 20 }) {
  const [copied, setCopied] = useState(false)

  async function handleShare(e) {
    e.preventDefault()
    e.stopPropagation()

    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '')

    if (navigator.share) {
      try {
        await navigator.share({ title: title || 'PostScholar discussion', url: shareUrl })
        return
      } catch (err) {
        if (err.name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Share failed:', err)
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`${styles.btn} ${className}`}
      aria-label={copied ? 'Link copied' : 'Share discussion'}
      title={copied ? 'Link copied!' : 'Share'}
    >
      {copied ? <Check size={size} /> : <Share2 size={size} />}
    </button>
  )
}
