import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from './landing.module.css'

export const metadata = {
  title: 'PostScholar — Academic discussion for published research',
  description: 'PostScholar is an open platform for discussing published academic papers. Paste a DOI, start a thread, and connect with verified authors via ORCID.',
  openGraph: {
    title: 'PostScholar — Academic discussion for published research',
    description: 'Open discussion for published research papers. Verified author badges via ORCID.',
    url: 'https://postscholar.org',
    type: 'website',
  },
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            "name": "PostScholar",
            "url": "https://postscholar.org",
            "description": "Open academic discussion platform for published research papers.",
            "potentialAction": {
              "@type": "SearchAction",
              "target": "https://postscholar.org/search?q={search_term_string}",
              "query-input": "required name=search_term_string"
            }
          })
        }}
      />
      <Layout bare>
        <div className={styles.page}>

          {/* Hero */}
          <section className={styles.hero}>
            <div className={styles.heroInner}>
              <div className={styles.badge}>Open academic discussion</div>
              <h1 className={styles.heroHeading}>
                Where researchers discuss<br />published papers
              </h1>
              <p className={styles.heroSubtext}>
                PostScholar is a free, open platform for discussing published research.
                Paste a DOI, start a thread, and engage with authors directly —
                verified via ORCID.
              </p>
              <div className={styles.heroCtas}>
                <Link href="/explore" className={styles.ctaPrimary}>
                  Browse discussions
                </Link>
                <Link href="/start" className={styles.ctaSecondary}>
                  Start a discussion
                </Link>
              </div>
            </div>
          </section>

          {/* Stats */}
          <section className={styles.stats}>
            <div className={styles.sectionInner}>
              <div className={styles.statRow}>
                <div className={styles.stat}>
                  <span className={styles.statNumber}>10</span>
                  <span className={styles.statLabel}>research fields</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statNumber}>51</span>
                  <span className={styles.statLabel}>sub-topics</span>
                </div>
                <div className={styles.statDivider} />
                <div className={styles.stat}>
                  <span className={styles.statNumber}>ORCID</span>
                  <span className={styles.statLabel}>verified authorship</span>
                </div>
              </div>
            </div>
          </section>

          {/* CTA */}
          <section className={styles.ctaSection}>
            <div className={styles.sectionInner}>
              <h2 className={styles.ctaHeading}>
                Start the conversation about a paper you care about
              </h2>
              <p className={styles.ctaText}>
                PostScholar is free and open. No institution required.
              </p>
              <Link href="/start" className={styles.ctaPrimary}>
                Start a discussion
              </Link>
            </div>
          </section>

        </div>
      </Layout>
    </>
  )
}
