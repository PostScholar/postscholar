import Link from 'next/link'
import styles from './Logo.module.css'

// Trimmed from rabbit-logo.png — full resolution so CSS downscale stays crisp
const MARK_W = 358
const MARK_H = 495

function LogoMark({ className }) {
  return (
    <img
      src="/rabbit-logo-mark.png"
      alt=""
      className={className}
      width={MARK_W}
      height={MARK_H}
      decoding="async"
    />
  )
}

export default function Logo({ variant = 'full', href = '/', className = '' }) {
  const content = (
    <span className={styles.logo}>
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
      <Link href={href} className={`${styles.link} ${className}`.trim()} aria-label="PostScholar home">
        {content}
      </Link>
    )
  }

  return content
}
