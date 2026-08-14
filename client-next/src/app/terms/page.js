'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Layout from '@/components/Layout'
import styles from '../privacy/Privacy.module.css'

const sections = [
  { id: 'acceptance', label: 'Acceptance of Terms' },
  { id: 'description', label: 'Description of Service' },
  { id: 'eligibility', label: 'Eligibility' },
  { id: 'accounts', label: 'User Accounts' },
  { id: 'content', label: 'User Content' },
  { id: 'conduct', label: 'Academic Conduct' },
  { id: 'prohibited', label: 'Prohibited Conduct' },
  { id: 'moderation', label: 'Moderation' },
  { id: 'intellectual-property', label: 'Intellectual Property' },
  { id: 'disclaimers', label: 'Disclaimers' },
  { id: 'limitation-liability', label: 'Limitation of Liability' },
  { id: 'indemnification', label: 'Indemnification' },
  { id: 'termination', label: 'Termination' },
  { id: 'changes', label: 'Changes to Terms' },
  { id: 'governing-law', label: 'Governing Law' },
  { id: 'contact', label: 'Contact Us' },
]

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState('acceptance')

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

          <h1 className={styles.heading}>Terms of Service</h1>
          <p className={styles.updated}>Last updated: January 15, 2026</p>

          <section id="acceptance" className={styles.section}>
            <h2>Acceptance of Terms</h2>
            <p>
              By accessing or using PostScholar ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and PostScholar. Your continued use of the Service following any changes to these Terms constitutes acceptance of those changes.
            </p>
          </section>

          <section id="description" className={styles.section}>
            <h2>Description of Service</h2>
            <p>
              PostScholar is an online platform for scholarly discussion of published research. The Service allows users to:
            </p>
            <ul>
              <li>Start discussions about academic papers identified by DOI or metadata</li>
              <li>Comment on and engage in discussions about published research</li>
              <li>Verify authorship via ORCID for specific discussions</li>
              <li>Bookmark and follow discussions and users</li>
              <li>Explore research discussions across academic disciplines</li>
            </ul>
            <p>
              PostScholar is <strong>not</strong> a publisher and does not host full-text papers unless linked externally by users. We provide a platform for discussion, not publication.
            </p>
          </section>

          <section id="eligibility" className={styles.section}>
            <h2>Eligibility</h2>
            <p>
              You must be at least 13 years old to use PostScholar. By using the Service, you represent and warrant that:
            </p>
            <ul>
              <li>You are at least 13 years of age</li>
              <li>You have the legal capacity to enter into these Terms</li>
              <li>You will comply with these Terms and all applicable laws</li>
              <li>You have not been previously banned from the Service</li>
            </ul>
            <p>
              Users under 18 should have parental or guardian consent to use the Service.
            </p>
          </section>

          <section id="accounts" className={styles.section}>
            <h2>User Accounts</h2>

            <h3>Account Creation</h3>
            <p>
              To access certain features, you must create an account. You may register using an email address and password, or via third-party OAuth providers (Google, GitHub, ORCID).
            </p>

            <h3>Account Security</h3>
            <p>
              You are responsible for:
            </p>
            <ul>
              <li>Maintaining the confidentiality of your password</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
            </ul>

            <h3>Account Accuracy</h3>
            <p>
              You must provide accurate and complete information when creating your account. Misrepresenting your identity, affiliation, or credentials is prohibited.
            </p>

            <h3>Account Deletion</h3>
            <p>
              You may delete your account at any time via account settings. Upon deletion:
            </p>
            <ul>
              <li>Your personal information will be anonymized</li>
              <li>Your discussions and comments will remain visible but attributed to "Deleted User"</li>
              <li>This action is irreversible</li>
            </ul>
          </section>

          <section id="content" className={styles.section}>
            <h2>User Content</h2>

            <h3>Ownership</h3>
            <p>
              You retain ownership of all content you post on PostScholar, including discussions, comments, and profile information ("User Content").
            </p>

            <h3>License to PostScholar</h3>
            <p>
              By posting User Content, you grant PostScholar a worldwide, non-exclusive, royalty-free, sublicensable, and transferable license to use, reproduce, distribute, display, and perform your User Content in connection with operating and improving the Service.
            </p>

            <h3>Your Responsibilities</h3>
            <p>
              You represent and warrant that:
            </p>
            <ul>
              <li>You own or have the necessary rights to your User Content</li>
              <li>Your User Content does not infringe any third-party rights</li>
              <li>Your User Content complies with these Terms and applicable laws</li>
            </ul>

            <h3>Public Nature of Content</h3>
            <p>
              All discussions and comments are public and visible to all users and visitors. Do not post content you wish to keep private.
            </p>
          </section>

          <section id="conduct" className={styles.section}>
            <h2>Academic Conduct</h2>

            <h3>Scholarly Discourse</h3>
            <p>
              PostScholar is intended for constructive academic discussion. We expect users to:
            </p>
            <ul>
              <li>Keep discussions relevant to the paper at hand</li>
              <li>Critique ideas, methods, and findings—not people</li>
              <li>Engage in good faith with intellectual humility</li>
              <li>Cite sources and acknowledge prior work</li>
              <li>Respect disciplinary norms and conventions</li>
            </ul>

            <h3>ORCID Verification</h3>
            <p>
              ORCID verification badges indicate that a user has successfully verified their ORCID iD for a specific discussion. Verification:
            </p>
            <ul>
              <li>Is voluntary and discussion-specific</li>
              <li>Does not guarantee the user is a listed author (verification relies on ORCID's data)</li>
              <li>Should not be misrepresented as institutional endorsement</li>
            </ul>

            <h3>Misrepresentation</h3>
            <p>
              You must not:
            </p>
            <ul>
              <li>Falsely claim authorship of papers</li>
              <li>Impersonate other researchers or institutions</li>
              <li>Misrepresent your credentials, affiliations, or expertise</li>
            </ul>
          </section>

          <section id="prohibited" className={styles.section}>
            <h2>Prohibited Conduct</h2>
            <p>
              You must not use the Service to:
            </p>
            <ul>
              <li><strong>Harass or abuse:</strong> Target individuals with personal attacks, threats, or hate speech</li>
              <li><strong>Spam:</strong> Post unsolicited advertising, promotional content, or repetitive messages</li>
              <li><strong>Infringe rights:</strong> Violate copyright, trademark, privacy, or other rights</li>
              <li><strong>Post illegal content:</strong> Share content that violates applicable laws</li>
              <li><strong>Manipulate the platform:</strong> Use bots, scripts, or automation to manipulate votes, comments, or metrics</li>
              <li><strong>Disrupt the service:</strong> Interfere with the operation or security of the platform</li>
              <li><strong>Evade bans:</strong> Create new accounts to circumvent suspensions or bans</li>
            </ul>
          </section>

          <section id="moderation" className={styles.section}>
            <h2>Moderation</h2>

            <h3>Content Review</h3>
            <p>
              We reserve the right to review, monitor, and remove User Content that violates these Terms or our community standards. Users may report comments for moderation review.
            </p>

            <h3>Enforcement Actions</h3>
            <p>
              We may take the following actions for violations:
            </p>
            <ul>
              <li><strong>Warning:</strong> A notice of the violation with guidance</li>
              <li><strong>Content Removal:</strong> Deletion of violating comments or discussions</li>
              <li><strong>Temporary Suspension:</strong> Temporary restriction of account access</li>
              <li><strong>Permanent Ban:</strong> Permanent termination of account access</li>
            </ul>

            <h3>Appeals</h3>
            <p>
              If you believe moderation action was taken in error, you may appeal by contacting{' '}
              <a href="mailto:hello@postscholar.org" className={styles.link}>
                hello@postscholar.org
              </a>{' '}
              within 14 days of the action.
            </p>
          </section>

          <section id="intellectual-property" className={styles.section}>
            <h2>Intellectual Property</h2>

            <h3>PostScholar's Rights</h3>
            <p>
              The Service, including its design, features, code, and branding (excluding User Content), is owned by PostScholar and protected by copyright, trademark, and other laws.
            </p>

            <h3>Restrictions</h3>
            <p>
              You may not:
            </p>
            <ul>
              <li>Copy, modify, or create derivative works of the Service</li>
              <li>Reverse engineer or decompile any part of the Service</li>
              <li>Use the PostScholar name, logo, or trademarks without permission</li>
              <li>Scrape or harvest data from the Service using automated tools (without prior written consent)</li>
            </ul>

            <h3>DMCA Notices</h3>
            <p>
              If you believe content on PostScholar infringes your copyright, please send a DMCA notice to{' '}
              <a href="mailto:hello@postscholar.org" className={styles.link}>
                hello@postscholar.org
              </a>{' '}
              with:
            </p>
            <ul>
              <li>Description of the copyrighted work</li>
              <li>URL of the infringing content</li>
              <li>Your contact information</li>
              <li>A statement of good faith belief</li>
              <li>A statement under penalty of perjury that the information is accurate</li>
              <li>Your physical or electronic signature</li>
            </ul>
          </section>

          <section id="disclaimers" className={styles.section}>
            <h2>Disclaimers</h2>

            <h3>No Warranty</h3>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.
            </p>

            <h3>User Content Disclaimer</h3>
            <p>
              User Content reflects the opinions of individual users, not PostScholar. We do not endorse, verify, or guarantee the accuracy, completeness, or reliability of User Content.
            </p>

            <h3>Third-Party Content</h3>
            <p>
              Paper metadata and links to external resources are provided for convenience. We do not guarantee the accuracy of third-party metadata (from CrossRef, DataCite, etc.) or control the content of external websites.
            </p>

            <h3>No Professional Advice</h3>
            <p>
              The Service is not a substitute for professional advice. Discussions on PostScholar should not be relied upon as legal, medical, financial, or other professional guidance.
            </p>
          </section>

          <section id="limitation-liability" className={styles.section}>
            <h2>Limitation of Liability</h2>
            <p>
              To the maximum extent permitted by law, PostScholar and its affiliates, officers, employees, and agents shall not be liable for:
            </p>
            <ul>
              <li>Indirect, incidental, special, consequential, or punitive damages</li>
              <li>Loss of profits, data, use, or goodwill</li>
              <li>Service interruptions or errors</li>
              <li>User Content or third-party conduct</li>
            </ul>
            <p>
              In no event shall PostScholar's total liability exceed $100 USD or the amount you paid to use the Service (if any) in the past 12 months.
            </p>
            <p>
              Some jurisdictions do not allow the exclusion of certain warranties or limitation of liability, so these limitations may not apply to you.
            </p>
          </section>

          <section id="indemnification" className={styles.section}>
            <h2>Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless PostScholar and its affiliates, officers, employees, and agents from any claims, liabilities, damages, losses, and expenses (including legal fees) arising from:
            </p>
            <ul>
              <li>Your use of the Service</li>
              <li>Your User Content</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
            </ul>
          </section>

          <section id="termination" className={styles.section}>
            <h2>Termination</h2>

            <h3>Termination by You</h3>
            <p>
              You may stop using the Service and delete your account at any time via account settings.
            </p>

            <h3>Termination by Us</h3>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without notice, for:
            </p>
            <ul>
              <li>Violation of these Terms</li>
              <li>Conduct that harms the Service or other users</li>
              <li>Legal or regulatory requirements</li>
              <li>Extended inactivity</li>
            </ul>

            <h3>Effect of Termination</h3>
            <p>
              Upon termination:
            </p>
            <ul>
              <li>Your right to access the Service ends immediately</li>
              <li>User Content may remain visible but anonymized (per our Privacy Policy)</li>
              <li>Provisions regarding User Content licenses, disclaimers, and limitations of liability survive termination</li>
            </ul>
          </section>

          <section id="changes" className={styles.section}>
            <h2>Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Material changes will be noted on this page with an updated "Last updated" date.
            </p>
            <p>
              Continued use of the Service after changes constitutes acceptance of the updated Terms. If you do not agree to the changes, you must stop using the Service.
            </p>
            <p>
              For significant changes that materially affect your rights, we will provide additional notice via email or a prominent platform notification.
            </p>
          </section>

          <section id="governing-law" className={styles.section}>
            <h2>Governing Law and Dispute Resolution</h2>

            <h3>Governing Law</h3>
            <p>
              These Terms are governed by the laws of the State of California, United States, without regard to conflict of law principles.
            </p>

            <h3>Dispute Resolution</h3>
            <p>
              Any disputes arising from these Terms or your use of the Service will be resolved through binding arbitration in accordance with the American Arbitration Association's rules, except that:
            </p>
            <ul>
              <li>You may bring claims in small claims court if they qualify</li>
              <li>Either party may seek injunctive relief in court for intellectual property infringement</li>
            </ul>

            <h3>Class Action Waiver</h3>
            <p>
              You agree to resolve disputes individually, not as part of a class action or representative proceeding.
            </p>
          </section>

          <section id="contact" className={styles.section}>
            <h2>Contact Us</h2>
            <p>
              If you have questions, concerns, or feedback regarding these Terms, please contact us:
            </p>
            <ul>
              <li>
                <strong>Email:</strong>{' '}
                <a href="mailto:hello@postscholar.org" className={styles.link}>
                  hello@postscholar.org
                </a>
              </li>
              <li><strong>Subject Line:</strong> "Terms of Service Inquiry"</li>
            </ul>
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
      </div>
    </Layout>
  )
}
