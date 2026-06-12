import Link from 'next/link'
import { redirect } from 'next/navigation'
import Layout from '@/components/Layout'
import PaperHeader from '@/components/PaperHeader'
import PaperSidebar from '@/components/PaperSidebar'
import DiscussionComments from '../[id]/DiscussionComments'
import { getServerApiUrl } from '@/lib/config'
import {
  buildDiscussionSlug,
  parseDiscussionId,
} from '@/lib/discussionSlug'
import { SITE_NAME, SITE_URL } from '@/lib/site'
import styles from '../[id]/Discussion.module.css'

async function getDiscussionData(id) {
  try {
    const res = await fetch(`${getServerApiUrl()}/discussions/${id}/paper`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Failed to fetch discussion data:', error)
    return null
  }
}

function buildJsonLd({ paper, discussionId, startedBy, discussionCreatedAt }) {
  const authors = paper.authors_json?.map(a => ({
    '@type': 'Person',
    name: [a.given, a.family].filter(Boolean).join(' '),
  })) || []

  const pageUrl = `${SITE_URL}/d/${buildDiscussionSlug(paper.title, discussionId)}`

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
    {
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
    },
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

  const data = await getDiscussionData(id)
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

  const data = await getDiscussionData(id)

  if (!data || data.error) {
    return (
      <Layout>
        <p className={styles.error}>Discussion not found.</p>
      </Layout>
    )
  }

  const { paper, started_by, discussion_created_at, custom_tags } = data
  const canonicalSlug = buildDiscussionSlug(paper.title, id)

  if (slug !== canonicalSlug) {
    redirect(`/d/${canonicalSlug}`)
  }

  const sidebar = paper ? (
    <PaperSidebar paper={paper} discussionId={id} />
  ) : null

  const jsonLd = buildJsonLd({
    paper,
    discussionId: id,
    startedBy: started_by,
    discussionCreatedAt: discussion_created_at,
  })

  return (
    <Layout sidebar={sidebar}>
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
        />
      )}
      <div className={styles.divider} />
      <DiscussionComments discussionId={id} />
    </Layout>
  )
}
