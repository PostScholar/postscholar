'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import styles from '@/app/login/Auth.module.css'

export default function PasswordInput({
  id,
  name,
  label,
  autoComplete,
  value,
  onChange,
  hint,
  required = true,
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className={styles.field}>
      {label ? <label className={styles.label} htmlFor={id}>{label}</label> : null}
      {hint && <p className={styles.hint}>{hint}</p>}
      <div className={styles.passwordWrap}>
        <input
          className={styles.input}
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={onChange}
          required={required}
        />
        <button
          type="button"
          className={styles.passwordToggle}
          onClick={() => setVisible(v => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  )
}
