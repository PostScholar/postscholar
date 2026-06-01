import { useState, useRef, useEffect } from 'react'
import styles from './TopicDropdown.module.css'

/**
 * TopicDropdown
 *
 * Custom dropdown for topic filtering on the feed.
 * Replaces the native <select> with a fully styled component.
 *
 * Props:
 *   topics       — array of top-level topics with children arrays
 *   value        — currently selected slug (empty string = all topics)
 *   onChange     — callback with the selected slug
 */
export default function TopicDropdown({ topics, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Find the display label for the current value
  function getLabel() {
    if (!value) return 'All topics'
    for (const parent of topics) {
      if (parent.slug === value) return parent.name
      for (const child of parent.children || []) {
        if (child.slug === value) return child.name
      }
    }
    return 'All topics'
  }

  function handleSelect(slug) {
    onChange(slug)
    setOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      {/* Trigger button */}
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className={styles.triggerLabel}>{getLabel()}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>
          &#8964;
        </span>
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className={styles.panel}>
          {/* All topics option */}
          <button
            className={`${styles.option} ${!value ? styles.selected : ''}`}
            onClick={() => handleSelect('')}
            type="button"
          >
            All topics
          </button>

          {/* Top-level topics with children */}
          {topics.map(parent => (
            <div key={parent.slug}>
              {/* Parent — selectable */}
              <button
                className={`${styles.option} ${styles.parentOption} ${value === parent.slug ? styles.selected : ''}`}
                onClick={() => handleSelect(parent.slug)}
                type="button"
              >
                {parent.name}
              </button>

              {/* Children */}
              {(parent.children || []).map(child => (
                <button
                  key={child.slug}
                  className={`${styles.option} ${styles.childOption} ${value === child.slug ? styles.selected : ''}`}
                  onClick={() => handleSelect(child.slug)}
                  type="button"
                >
                  {child.name}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
