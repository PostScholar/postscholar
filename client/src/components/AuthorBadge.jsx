import styles from './AuthorBadge.module.css'

/**
 * AuthorBadge
 *
 * Renders a small "author" pill next to a username when
 * is_verified_author is true. Renders nothing otherwise.
 */
export default function AuthorBadge({ isVerifiedAuthor }) {
  if (!isVerifiedAuthor) return null
  return <span className={styles.badge}>author</span>
}
