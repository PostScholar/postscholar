import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from '../landing.module.css'

export const metadata = {
  title: 'About — PostScholar',
  description: 'PostScholar is a free, open platform for discussing published academic research.',
}

export default function AboutPage() {
  return (
    <Layout>
      <div className={styles.page} style={{ maxWidth: 720, margin: '0 auto', padding: 'var(--space-8) clamp(1rem, 4vw, 2rem)' }}>
        <Link href="/" className="backLink">← Home</Link>
        <h1 className={styles.sectionHeading} style={{ marginTop: 'var(--space-4)' }}>About PostScholar</h1>
        <p className={styles.featureText} style={{ fontSize: 'var(--text-base)', lineHeight: 1.75, marginBottom: 'var(--space-4)' }}>
          PostScholar is an open platform for post-publication discourse. Researchers paste a DOI,
          review paper metadata from CrossRef, and open focused threads around published work.
        </p>
        <p className={styles.featureText} style={{ fontSize: 'var(--text-base)', lineHeight: 1.75, marginBottom: 'var(--space-6)' }}>
          Authors can verify their identity through ORCID and receive badges on their contributions.
          The platform is free, institution-agnostic, and designed for thoughtful academic conversation.
        </p>
        <Link href="/explore" className={styles.ctaPrimary}>
          Browse discussions
        </Link>
      </div>
    </Layout>
  )
}
