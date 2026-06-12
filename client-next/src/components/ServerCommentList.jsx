import Link from 'next/link'
import styles from './Comment.module.css'
import serverStyles from './ServerCommentList.module.css'

function flattenComments(comments, depth = 0, out = []) {
  for (const comment of comments || []) {
    out.push({ comment, depth })
    if (comment.replies?.length) {
      flattenComments(comment.replies, depth + 1, out)
    }
  }
  return out
}

/**
 * Crawlable HTML — first page of comments rendered on the server.
 * Interactive UI is provided by DiscussionComments (hydrated with the same data).
 */
export default function ServerCommentList({ comments }) {
  const flat = flattenComments(comments)
  if (flat.length === 0) return null

  return (
    <section
      className={serverStyles.section}
      aria-label="Discussion comments"
      id="discussion-comments"
    >
      <h2 className={serverStyles.heading}>Comments ({flat.length})</h2>
      <ol className={serverStyles.list}>
        {flat.map(({ comment, depth }) => (
          <li
            key={comment.id}
            className={serverStyles.item}
            style={{ marginLeft: `${Math.min(depth, 4) * 16}px` }}
          >
            <header className={serverStyles.meta}>
              <Link href={`/u/${comment.username}`}>{comment.username}</Link>
              {comment.created_at && (
                <time dateTime={comment.created_at}>
                  {new Date(comment.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </time>
              )}
            </header>
            <p className={styles.text}>{comment.body}</p>
          </li>
        ))}
      </ol>
    </section>
  )
}
