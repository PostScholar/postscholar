import Link from 'next/link'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import PaperHeader from '@/components/PaperHeader'
import PaperSidebar from '@/components/PaperSidebar'
import DiscussionComments from '../[id]/DiscussionComments'
import ServerCommentList from '@/components/ServerCommentList'
import {
  getDiscussionPaper,
  getDiscussionComments,
  getDiscussionStats,
} from '@/lib/discussionData'
import {
  buildDiscussionSlug,
  parseDiscussionId,
} from '@/lib/discussionSlug'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import styles from '../[id]/Discussion.module.css'

function flattenComments(comments, out = []) {
  for (const comment of comments || []) {
    out.push(comment)
    if (comment.replies?.length) flattenComments(comment.replies, out)
  }
  return out
}

function getLatestActivity(comments, fallback) {
  const flat = flattenComments(comments)
  if (flat.length === 0) return fallback
  return flat.reduce((latest, c) => {
    if (!latest || new Date(c.created_at) > new Date(latest)) return c.created_at
    return latest
  }, null)
}

function buildJsonLd({
  paper,
  discussionId,
  startedBy,
  discussionCreatedAt,
  comments,
}) {
  const authors = paper.authors_json?.map(a => ({
    '@type': 'Person',
    name: [a.given, a.family].filter(Boolean).join(' '),
  })) || []

  const pageUrl = `${SITE_URL}/d/${buildDiscussionSlug(paper.title, discussionId)}`
  const flatComments = flattenComments(comments)

  const forumPosting = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: paper.title,
    name: paper.title,
    url: pageUrl,
    datePublished: discussionCreatedAt,
    author: startedBy
      ? { '@type': 'Person', name: startedBy }
      : { '@type': 'Organization', name: SITE_NAME },
    about: {
      '@type': 'ScholarlyArticle',
      headline: paper.title,
      identifier: paper.doi ? `https://doi.org/${paper.doi}` : undefined,
    },
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  }

  if (flatComments.length > 0) {
    forumPosting.comment = flatComments.slice(0, 10).map(c => ({
      '@type': 'Comment',
      text: c.body,
      author: { '@type': 'Person', name: c.username },
      dateCreated: c.created_at,
    }))
    forumPosting.commentCount = flatComments.length
  }

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'ScholarlyArticle',
      headline: paper.title,
      name: paper.title,
      identifier: paper.doi ? `https://doi.org/${paper.doi}` : undefined,
      author: authors.length > 0 ? authors : undefined,
      datePublished: paper.year ? `${paper.year}` : undefined,
      publisher: paper.journal
        ? { '@type': 'Organization', name: paper.journal }
        : undefined,
      description: paper.abstract || undefined,
      url: pageUrl,
      isPartOf: {
        '@type': 'WebSite',
        name: SITE_NAME,
        url: SITE_URL,
      },
    },
    forumPosting,
  ]
}

export async function generateMetadata({ params }) {
  const { slug } = await params
  const id = parseDiscussionId(slug)
  if (!id) {
    return {
      title: 'Discussion — PostScholar',
      description: 'Academic discussion on PostScholar',
    }
  }

  const data = await getDiscussionPaper(id)
  if (!data || data.error) {
    return {
      title: 'Discussion — PostScholar',
      description: 'Academic discussion on PostScholar',
    }
  }

  const { paper } = data
  const authors =
    paper.authors_json?.map(a => `${a.given} ${a.family}`).join(', ') || ''
  const title = paper.title ? `${paper.title} — PostScholar` : 'Discussion — PostScholar'
  const description = paper.abstract
    ? paper.abstract.slice(0, 160)
    : `Discussion of "${paper.title}" on PostScholar`
  const canonicalSlug = buildDiscussionSlug(paper.title, id)
  const canonicalPath = `/d/${canonicalSlug}`

  return {
    title,
    description,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: paper.title,
      description: paper.abstract?.slice(0, 200) || description,
      type: 'article',
      url: canonicalPath,
      siteName: SITE_NAME,
      locale: 'en_US',
      authors: authors ? [authors] : undefined,
      publishedTime: data.discussion_created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title: paper.title,
      description: paper.abstract?.slice(0, 200) || description,
    },
  }
}

export default async function DiscussionPage({ params }) {
  const { slug } = await params
  const id = parseDiscussionId(slug)

  if (!id) {
    return (
      <Layout>
        <p className={styles.error}>Discussion not found.</p>
      </Layout>
    )
  }

  const [data, commentsData, stats] = await Promise.all([
    getDiscussionPaper(id),
    getDiscussionComments(id),
    getDiscussionStats(id),
  ])

  if (!data || data.error) {
    return (
      <Layout>
        <p className={styles.error}>Discussion not found.</p>
      </Layout>
    )
  }

  const { paper, started_by, discussion_created_at, custom_tags } = data
  const initialComments = commentsData.comments || []
  const initialNextCursor = commentsData.next_cursor || null
  const latestActivity = getLatestActivity(
    initialComments,
    data.discussion_created_at
  )
  const canonicalSlug = buildDiscussionSlug(paper.title, id)

  if (slug !== canonicalSlug) {
    redirect(`/d/${canonicalSlug}`)
  }

  const jsonLd = buildJsonLd({
    paper,
    discussionId: id,
    startedBy: started_by,
    discussionCreatedAt: discussion_created_at,
    comments: initialComments,
  })

  return (
    <Layout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Link href="/explore" className="backLink">
        ← Discussions
      </Link>
      {paper && (
        <PaperHeader
          paper={paper}
          startedBy={started_by}
          discussionCreatedAt={discussion_created_at}
          customTags={custom_tags || []}
          discussionId={id}
          stats={stats}
          latestActivity={latestActivity}
        />
      )}
      <div className={styles.pageLayout}>
        {paper && (
          <aside className={styles.pageSidebar}>
            <PaperSidebar paper={paper} discussionId={id} />
          </aside>
        )}
        <div className={styles.pageMain}>
          <h2 className={styles.discussionHeader}>Discussion</h2>
          <div className={styles.divider} />
          <noscript>
            <ServerCommentList comments={initialComments} />
          </noscript>
          <DiscussionComments
            key={id}
            discussionId={id}
            initialComments={initialComments}
            initialNextCursor={initialNextCursor}
          />
        </div>
      </div>
    </Layout>
  )
}
