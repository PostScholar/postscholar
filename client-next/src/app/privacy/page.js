import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from './Privacy.module.css'

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy Policy for PostScholar — how we collect and use your data.',
  alternates: {
    canonical: '/privacy',
  },
}

export default function PrivacyPage() {
  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.heading}>Privacy Policy</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <section className={styles.section}>
          <h2>What we collect</h2>
          <p>
            When you register, we store your email address, username, and a hashed password.
            We also store content you create: discussions, comments, bookmarks, and profile
            information you choose to add.
          </p>
        </section>

        <section className={styles.section}>
          <h2>ORCID verification</h2>
          <p>
            If you verify as an author via ORCID, we store your ORCID iD and verification
            status for specific discussions. We do not publish your ORCID iD without your
            action to verify.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Cookies</h2>
          <p>
            We use an httpOnly session cookie to keep you signed in. We do not use
            third-party advertising cookies.
          </p>
        </section>

        <section className={styles.section}>
          <h2>How we use data</h2>
          <p>
            Your data is used to operate the platform: authentication, displaying your
            contributions, mentions, moderation of reported content, and improving the
            service. We do not sell your personal data.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Contact</h2>
          <p>
            Questions about this policy? Contact us at{' '}
            <a href="mailto:hello@postscholar.org" className={styles.link}>
              hello@postscholar.org
            </a>.
          </p>
        </section>

        <p className={styles.back}>
          <Link href="/terms" className={styles.link}>Terms of Service</Link>
          {' · '}
          <Link href="/" className={styles.link}>← Back to home</Link>
        </p>
      </div>
    </Layout>
  )
}
