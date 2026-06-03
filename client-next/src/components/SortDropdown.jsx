'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './SortDropdown.module.css'

/**
 * SortDropdown
 *
 * Reusable sort dropdown used on the feed and discussion page.
 *
 * Props:
 *   options  — array of { value, label }
 *   value    — currently selected value
 *   onChange — callback with new value
 */
export default function SortDropdown({ options, value, onChange }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const current = options.find(o => o.value === value) || options[0]

  function handleSelect(val) {
    onChange(val)
    setOpen(false)
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={`${styles.trigger} ${open ? styles.triggerOpen : ''}`}
        onClick={() => setOpen(o => !o)}
        type="button"
      >
        <span className={styles.triggerLabel}>{current.label}</span>
        <span className={`${styles.chevron} ${open ? styles.chevronOpen : ''}`}>&#8964;</span>
      </button>

      {open && (
        <div className={styles.panel}>
          {options.map(opt => (
            <button
              key={opt.value}
              className={`${styles.option} ${value === opt.value ? styles.selected : ''}`}
              onClick={() => handleSelect(opt.value)}
              type="button"
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}