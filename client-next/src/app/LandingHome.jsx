import Link from 'next/link'
import { discussionPath } from '@/lib/discussionSlug'
import Layout from '@/components/Layout'
import styles from './landing.module.css'

function formatAuthors(authors) {
  if (!authors?.length) return ''
  const names = authors.map(a => a.family).filter(Boolean)
  if (names.length <= 2) return names.join(' · ')
  return `${names[0]} · ${names[1]} +${names.length - 2}`
}

export default function LandingHome({ discussions = [] }) {
  const preview = discussions.slice(0, 5)

  return (
    <Layout bare>
      <div className={styles.page}>
        <section className={styles.hero}>
          <div className={styles.heroInner}>
            <div className={styles.badge}>Post-publication discussion</div>
            <h1 className={styles.heroHeading}>
              Where researchers discuss<br />published papers
            </h1>
            <p className={styles.heroSubtext}>
              Post-publication discussion for published research.
              Paste a DOI, start a thread, and engage with authors — verified via ORCID.
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

        <section className={styles.stats}>
          <div className={styles.sectionInner}>
            <div className={styles.statRow}>
              <div className={styles.stat}>
                <span className={styles.statNumber}>DOI</span>
                <span className={styles.statLabel}>instant paper lookup</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNumber}>ORCID</span>
                <span className={styles.statLabel}>verified authorship</span>
              </div>
              <div className={styles.statDivider} />
              <div className={styles.stat}>
                <span className={styles.statNumber}>Open</span>
                <span className={styles.statLabel}>free for researchers</span>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionInner}>
            <h2 className={styles.sectionHeading}>How it works</h2>
            <div className={styles.featureGrid}>
              <div className={styles.featureCard}>
                <span className={styles.featureStep}>01</span>
                <h3 className={styles.featureTitle}>Find the paper</h3>
                <p className={styles.featureText}>
                  Enter a DOI to pull title, authors, and abstract from CrossRef — or add details manually.
                </p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureStep}>02</span>
                <h3 className={styles.featureTitle}>Start the thread</h3>
                <p className={styles.featureText}>
                  Tag topics, add context, and open a focused discussion around the published work.
                </p>
              </div>
              <div className={styles.featureCard}>
                <span className={styles.featureStep}>03</span>
                <h3 className={styles.featureTitle}>Engage with authors</h3>
                <p className={styles.featureText}>
                  Reply, mention colleagues, and recognize verified authors through ORCID badges.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionInner}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionHeading}>Recent discussions</h2>
              <Link href="/explore" className={styles.seeAll}>View all →</Link>
            </div>

            {preview.length === 0 ? (
              <p className={styles.emptyPreview}>
                No discussions yet.{' '}
                <Link href="/start">Be the first to start one.</Link>
              </p>
            ) : (
              <div className={styles.discussionList}>
                {preview.map(d => (
                  <Link
                    key={d.id}
                    href={discussionPath({ id: d.id, title: d.title })}
                    className={styles.discussionItem}
                  >
                    <h3 className={`${styles.discussionTitle} paper-title`}>{d.title}</h3>
                    <p className={styles.discussionMeta}>
                      {[d.username || d.started_by, formatAuthors(d.authors_json), d.journal, d.year]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                    <div className={styles.discussionFooter}>
                      <span className={styles.commentCount}>
                        {d.comment_count === 0
                          ? 'No comments yet'
                          : `${d.comment_count} comment${d.comment_count === 1 ? '' : 's'}`}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.sectionInner}>
            <h2 className={styles.ctaHeading}>
              Bring rigor and conversation together
            </h2>
            <p className={styles.ctaText}>
              A professional space for post-publication discourse. No institution required.
            </p>
            <Link href="/register" className={styles.ctaPrimary}>
              Create an account
            </Link>
          </div>
        </section>
      </div>
    </Layout>
  )
}
