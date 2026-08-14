import Link from 'next/link'
import styles from './Logo.module.css'

export default function Logo({ variant = 'full', href = '/', className = '' }) {
  const content = (
    <span className={styles.logo}>
      {variant === 'full' && (
        <span className={styles.wordmark}>
          Post<span className={styles.accent}>Scholar</span>
        </span>
      )}
    </span>
  )

  if (href) {
    return (
      <Link href={href} className={`${styles.link} ${className}`.trim()} aria-label="PostScholar home">
        {content}
      </Link>
    )
  }

  return content
}
