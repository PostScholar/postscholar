import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from '../privacy/Privacy.module.css'

export const metadata = {
  title: 'Terms of Service — PostScholar',
  description:
    'Terms of Service for PostScholar — academic discussion platform for published research.',
  alternates: {
    canonical: '/terms',
  },
}

export default function TermsPage() {
  return (
    <Layout>
      <div className={styles.page}>
        <h1 className={styles.heading}>Terms of Service</h1>
        <p className={styles.updated}>Last updated: June 2026</p>

        <section className={styles.section}>
          <h2>Acceptance</h2>
          <p>
            By using PostScholar, you agree to these terms. If you do not agree,
            please do not use the service.
          </p>
        </section>

        <section className={styles.section}>
          <h2>What PostScholar is</h2>
          <p>
            PostScholar is a platform for scholarly discussion of published
            research. Users may start or join discussions about papers identified
            by DOI or metadata. We are not a publisher and do not host full-text
            papers unless linked externally by users.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Your account and content</h2>
          <p>
            You are responsible for your account and for content you post. You
            must not post spam, harassment, illegal material, or content that
            infringes others&apos; rights. You retain ownership of your posts;
            you grant PostScholar a non-exclusive license to display and
            distribute them on the platform.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Academic conduct</h2>
          <p>
            Discussions should stay relevant to the paper at hand. Critique ideas,
            not people. Misrepresentation of authorship or credentials is not
            permitted. ORCID verification badges reflect successful verification
            for a specific discussion only.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Moderation</h2>
          <p>
            We may remove content or suspend accounts that violate these terms or
            our community standards. Users may report comments; moderators review
            reports and take appropriate action.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Disclaimer</h2>
          <p>
            PostScholar is provided &quot;as is.&quot; Discussion content reflects
            user opinions, not PostScholar&apos;s views. We do not guarantee
            accuracy of user comments or third-party paper metadata.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Changes</h2>
          <p>
            We may update these terms. Continued use after changes constitutes
            acceptance. Material changes will be noted on this page.
          </p>
        </section>

        <section className={styles.section}>
          <h2>Contact</h2>
          <p>
            Questions? Contact{' '}
            <a href="mailto:hello@postscholar.org" className={styles.link}>
              hello@postscholar.org
            </a>.
          </p>
        </section>

        <p className={styles.back}>
          <Link href="/privacy" className={styles.link}>
            Privacy Policy
          </Link>
          {' · '}
          <Link href="/" className={styles.link}>
            ← Back to home
          </Link>
        </p>
      </div>
    </Layout>
  )
}
