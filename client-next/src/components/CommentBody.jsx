import Link from 'next/link'
import { hasLatex, renderLatex } from '@/lib/renderLatex'
import styles from './Comment.module.css'

export default function CommentBody({ body }) {
  if (!body) return null

  const parts = body.split(/(@\w+)/g)

  return (
    <p className={styles.text}>
      {parts.map((part, i) => {
        const mention = part.match(/^@(\w+)$/)
        if (mention) {
          return (
            <Link
              key={i}
              href={`/u/${mention[1]}`}
              className={styles.mention}
            >
              @{mention[1]}
            </Link>
          )
        }
        if (hasLatex(part)) {
          return (
            <span
              key={i}
              dangerouslySetInnerHTML={{ __html: renderLatex(part) }}
            />
          )
        }
        return <span key={i}>{part}</span>
      })}
    </p>
  )
}
