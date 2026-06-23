import Image from 'next/image'
import Link from 'next/link'
import styles from './Logo.module.css'

function LogoMark({ className }) {
  return (
    <Image
      src="/logo-mark.png"
      alt=""
      width={23}
      height={32}
      className={className}
      priority
    />
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
