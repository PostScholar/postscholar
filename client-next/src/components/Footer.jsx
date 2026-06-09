import Link from 'next/link'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.links}>
        <Link href="/" className={styles.link}>Home</Link>
        <Link href="/explore" className={styles.link}>Discussions</Link>
        <Link href="/about" className={styles.link}>About</Link>
        <Link href="/start" className={styles.link}>Start a discussion</Link>
      </div>
      <p className={styles.text}>
        PostScholar © 2026
      </p>
    </footer>
  )
}
