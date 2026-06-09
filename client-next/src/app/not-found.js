import Link from 'next/link'
import styles from './not-found.module.css'

export const metadata = {
  title: 'Page not found — PostScholar',
}

export default function NotFound() {
  return (
    <div className={styles.page}>
      <div className={styles.content}>
        <div className={styles.code}>404</div>
        <h1 className={styles.heading}>Page not found</h1>
        <p className={styles.message}>
          The page you are looking for does not exist or has been moved.
        </p>
        <div className={styles.actions}>
          <Link href="/" className={styles.homeBtn}>Go home</Link>
          <Link href="/explore" className={styles.exploreBtn}>Browse discussions</Link>
        </div>
      </div>
    </div>
  )
}
