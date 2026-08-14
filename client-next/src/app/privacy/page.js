'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from './Privacy.module.css'

const sections = [
  { id: 'overview', label: 'Overview' },
  { id: 'information-we-collect', label: 'Information We Collect' },
  { id: 'how-we-use', label: 'How We Use Your Information' },
  { id: 'legal-basis', label: 'Legal Basis for Processing' },
  { id: 'sharing', label: 'Sharing Your Information' },
  { id: 'data-retention', label: 'Data Retention' },
  { id: 'your-rights', label: 'Your Rights' },
  { id: 'cookies', label: 'Cookies and Tracking' },
  { id: 'security', label: 'Security' },
  { id: 'international', label: 'International Transfers' },
  { id: 'children', label: 'Children's Privacy' },
  { id: 'changes', label: 'Changes to This Policy' },
  { id: 'contact', label: 'Contact Us' },
]

export default function PrivacyPage() {
  const [activeSection, setActiveSection] = useState('overview')

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: '-80px 0px -80% 0px',
      threshold: 0,
    }

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id)
        }
      })
    }

    const observer = new IntersectionObserver(observerCallback, observerOptions)

    sections.forEach(({ id }) => {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    })

    return () => observer.disconnect()
  }, [])

  const handleMobileNavChange = (e) => {
    const sectionId = e.target.value
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <Layout>
      <div className={styles.container}>
        <aside className={styles.sidebar}>
          <nav className={styles.nav}>
            {sections.map(({ id, label }) => (
              <a
                key={id}
                href={`#${id}`}
                className={`${styles.navLink} ${activeSection === id ? styles.active : ''}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                {label}
              </a>
            ))}
          </nav>
        </aside>

        <div className={styles.content}>
          <div className={styles.mobileNav}>
            <select
              className={styles.mobileNavSelect}
              value={activeSection}
              onChange={handleMobileNavChange}
            >
              {sections.map(({ id, label }) => (
                <option key={id} value={id}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <h1 className={styles.heading}>Privacy Policy</h1>
          <p className={styles.updated}>Last updated: January 15, 2026</p>

          <section id="overview" className={styles.section}>
            <h2>Overview</h2>
            <p>
              PostScholar ("we," "our," or "us") operates an academic discussion platform for published research. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our service.
            </p>
            <p>
              We are committed to protecting your privacy and complying with applicable data protection laws, including the General Data Protection Regulation (GDPR) and the California Consumer Privacy Act (CCPA).
            </p>
          </section>

          <section id="information-we-collect" className={styles.section}>
            <h2>Information We Collect</h2>

            <h3>Information You Provide</h3>
            <ul>
              <li><strong>Account Information:</strong> When you register, we collect your email address, username, and password (stored as a cryptographic hash).</li>
              <li><strong>Profile Information:</strong> You may optionally provide a display name, bio, affiliation, location, website URL, Twitter handle, Google Scholar profile, and profile picture.</li>
              <li><strong>Content:</strong> We store discussions, comments, bookmarks, and other content you create on the platform.</li>
              <li><strong>ORCID Verification:</strong> If you verify as an author via ORCID, we store your ORCID iD and verification status for specific discussions.</li>
            </ul>

            <h3>Information Collected Automatically</h3>
            <ul>
              <li><strong>Usage Data:</strong> We collect information about how you interact with the platform, including pages viewed, features used, and actions taken.</li>
              <li><strong>Device Information:</strong> We collect device type, browser type, IP address, and operating system.</li>
              <li><strong>Cookies:</strong> We use session cookies to keep you signed in. See "Cookies and Tracking" below for details.</li>
            </ul>

            <h3>Information from Third Parties</h3>
            <ul>
              <li><strong>OAuth Providers:</strong> If you sign in via Google, GitHub, or ORCID, we receive basic profile information (name, email, profile picture) from those services.</li>
              <li><strong>Research Metadata:</strong> We fetch paper metadata from CrossRef, DataCite, and other academic APIs based on DOIs you provide.</li>
            </ul>
          </section>

          <section id="how-we-use" className={styles.section}>
            <h2>How We Use Your Information</h2>
            <p>We use your information for the following purposes:</p>
            <ul>
              <li><strong>Provide the Service:</strong> To operate the platform, display your contributions, and enable discussions.</li>
              <li><strong>Authentication:</strong> To verify your identity and maintain your session.</li>
              <li><strong>Communication:</strong> To send you notifications, mentions, and service updates.</li>
              <li><strong>Moderation:</strong> To review reported content and enforce our Terms of Service.</li>
              <li><strong>Analytics:</strong> To understand usage patterns and improve the platform.</li>
              <li><strong>Legal Compliance:</strong> To comply with legal obligations and enforce our policies.</li>
            </ul>
          </section>

          <section id="legal-basis" className={styles.section}>
            <h2>Legal Basis for Processing (GDPR)</h2>
            <p>For users in the European Economic Area (EEA), UK, and Switzerland, we process your personal data under the following legal bases:</p>
            <table>
              <thead>
                <tr>
                  <th>Purpose</th>
                  <th>Legal Basis</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Provide core platform features</td>
                  <td>Performance of contract (Terms of Service)</td>
                </tr>
                <tr>
                  <td>Send service notifications and updates</td>
                  <td>Legitimate interest (platform operation)</td>
                </tr>
                <tr>
                  <td>Moderate content and enforce policies</td>
                  <td>Legitimate interest (community safety)</td>
                </tr>
                <tr>
                  <td>Analytics and service improvement</td>
                  <td>Legitimate interest (product development)</td>
                </tr>
                <tr>
                  <td>Comply with legal obligations</td>
                  <td>Legal obligation</td>
                </tr>
              </tbody>
            </table>
          </section>

          <section id="sharing" className={styles.section}>
            <h2>Sharing Your Information</h2>

            <h3>Public Information</h3>
            <p>
              The following information is publicly visible to all users and visitors:
            </p>
            <ul>
              <li>Your username and display name</li>
              <li>Profile information you choose to add (bio, affiliation, website, etc.)</li>
              <li>Discussions, comments, and other content you post</li>
              <li>ORCID verification badges (only for discussions you verify)</li>
            </ul>

            <h3>Service Providers</h3>
            <p>
              We share data with third-party service providers who help us operate the platform:
            </p>
            <ul>
              <li><strong>Hosting:</strong> Render (infrastructure), Neon (database)</li>
              <li><strong>Email:</strong> Email service providers for transactional emails</li>
              <li><strong>Analytics:</strong> Aggregated usage analytics (no personal identifiers)</li>
            </ul>

            <h3>Legal Requirements</h3>
            <p>
              We may disclose your information if required by law, court order, or government request, or if necessary to protect the rights, property, or safety of PostScholar, our users, or others.
            </p>

            <h3>Business Transfers</h3>
            <p>
              If PostScholar is involved in a merger, acquisition, or sale of assets, your information may be transferred. We will notify you via email and/or a prominent notice on the platform before your data is transferred and becomes subject to a different privacy policy.
            </p>

            <h3>What We Do Not Do</h3>
            <p>
              We <strong>do not</strong> sell, rent, or trade your personal information to third parties for their marketing purposes.
            </p>
          </section>

          <section id="data-retention" className={styles.section}>
            <h2>Data Retention</h2>
            <p>We retain your information for as long as your account is active or as needed to provide services. Specific retention periods:</p>
            <ul>
              <li><strong>Account Data:</strong> Retained until you delete your account.</li>
              <li><strong>Content:</strong> Discussions and comments remain visible but are anonymized after account deletion.</li>
              <li><strong>Logs and Analytics:</strong> Retained for up to 90 days for security and debugging purposes.</li>
              <li><strong>Backups:</strong> Deleted data may persist in backups for up to 30 days before permanent deletion.</li>
            </ul>
          </section>

          <section id="your-rights" className={styles.section}>
            <h2>Your Rights</h2>
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>

            <h3>GDPR Rights (EEA, UK, Switzerland)</h3>
            <ul>
              <li><strong>Access:</strong> Request a copy of your personal data.</li>
              <li><strong>Rectification:</strong> Correct inaccurate or incomplete data.</li>
              <li><strong>Erasure:</strong> Request deletion of your account and personal data.</li>
              <li><strong>Restriction:</strong> Request limited processing of your data.</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format.</li>
              <li><strong>Object:</strong> Object to processing based on legitimate interests.</li>
              <li><strong>Withdraw Consent:</strong> Where processing is based on consent, you may withdraw it at any time.</li>
            </ul>

            <h3>CCPA Rights (California)</h3>
            <ul>
              <li><strong>Know:</strong> Request disclosure of personal information collected, used, and shared.</li>
              <li><strong>Delete:</strong> Request deletion of your personal information.</li>
              <li><strong>Opt-Out:</strong> Opt out of the "sale" of personal information (note: we do not sell personal information).</li>
              <li><strong>Non-Discrimination:</strong> You will not be discriminated against for exercising your rights.</li>
            </ul>

            <h3>How to Exercise Your Rights</h3>
            <p>
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:hello@postscholar.org" className={styles.link}>
                hello@postscholar.org
              </a>{' '}
              or use the account deletion feature in your settings. We will respond within 30 days.
            </p>
          </section>

          <section id="cookies" className={styles.section}>
            <h2>Cookies and Tracking</h2>

            <h3>Session Cookie</h3>
            <p>
              We use a single httpOnly session cookie to keep you signed in. This cookie:
            </p>
            <ul>
              <li>Is essential for platform functionality</li>
              <li>Cannot be accessed by JavaScript (httpOnly flag)</li>
              <li>Is transmitted only over HTTPS (secure flag)</li>
              <li>Expires after 30 days of inactivity</li>
            </ul>

            <h3>No Third-Party Advertising Cookies</h3>
            <p>
              We <strong>do not</strong> use third-party advertising cookies, social media trackers, or cross-site tracking technologies.
            </p>
          </section>

          <section id="security" className={styles.section}>
            <h2>Security</h2>
            <p>We implement industry-standard security measures to protect your data:</p>
            <ul>
              <li><strong>Encryption:</strong> All data transmitted over HTTPS; database connections use TLS.</li>
              <li><strong>Password Security:</strong> Passwords are hashed using bcrypt with per-user salts.</li>
              <li><strong>Access Controls:</strong> Database access is restricted to authorized personnel only.</li>
              <li><strong>Regular Updates:</strong> Dependencies and infrastructure are kept up to date.</li>
            </ul>
            <p>
              While we strive to protect your data, no method of transmission or storage is 100% secure. If you discover a security vulnerability, please report it to{' '}
              <a href="mailto:hello@postscholar.org" className={styles.link}>
                hello@postscholar.org
              </a>.
            </p>
          </section>

          <section id="international" className={styles.section}>
            <h2>International Transfers</h2>
            <p>
              PostScholar is operated from the United States. If you are accessing the service from outside the U.S., your information will be transferred to, stored, and processed in the U.S.
            </p>
            <p>
              For users in the EEA, UK, and Switzerland, we rely on Standard Contractual Clauses (SCCs) approved by the European Commission to ensure adequate protection for your data when transferred internationally.
            </p>
          </section>

          <section id="children" className={styles.section}>
            <h2>Children's Privacy</h2>
            <p>
              PostScholar is not intended for users under the age of 13. We do not knowingly collect personal information from children under 13. If we become aware that we have collected data from a child under 13, we will delete it promptly.
            </p>
            <p>
              If you believe we have inadvertently collected information from a child under 13, please contact us at{' '}
              <a href="mailto:hello@postscholar.org" className={styles.link}>
                hello@postscholar.org
              </a>.
            </p>
          </section>

          <section id="changes" className={styles.section}>
            <h2>Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Material changes will be noted on this page with an updated "Last updated" date. Continued use of the service after changes constitutes acceptance of the updated policy.
            </p>
            <p>
              For significant changes that affect your rights, we will provide additional notice via email or a prominent platform notification.
            </p>
          </section>

          <section id="contact" className={styles.section}>
            <h2>Contact Us</h2>
            <p>
              If you have questions, concerns, or requests regarding this Privacy Policy or your personal data, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@postscholar.org" className={styles.link}>
                  hello@postscholar.org
                </a>
              </li>
              <li><strong>Subject Line:</strong> "Privacy Inquiry" or "Data Request"</li>
            </ul>
            <p>
              We will respond to all requests within 30 days, or as required by applicable law.
            </p>
          </section>

          <p className={styles.back}>
            <Link href="/terms" className={styles.link}>
              Terms of Service
            </Link>
            {' · '}
            <Link href="/" className={styles.link}>
              ← Back to home
            </Link>
          </p>
        </div>
      </div>
    </Layout>
  )
}
