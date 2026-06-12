import Link from 'next/link'
import styles from './Logo.module.css'

function LogoMark({ className }) {
  return (
    <svg
      className={className}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M9 8c0-1.5 1.2-2.5 2.8-2.5 1.4 0 2.5.8 2.8 2"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M8 12c2.5-1 5.5-1 8 0 2.5 1 4.5 3 6 5.5"
        stroke="var(--brand)"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      <path
        d="M22 18.5h6M25 15.5v6"
        stroke="var(--brand)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}

export default function Logo({ variant = 'full', href = '/', className = '' }) {
  const content = (
    <span className={`${styles.logo} ${className}`}>
      <LogoMark className={styles.mark} />
      {variant === 'full' && (
        <span className={styles.wordmark}>
          Post<span className={styles.accent}>Scholar</span>
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={styles.link} aria-label="PostScholar home">
        {content}
      </Link>
    )
  }

  return content
}
