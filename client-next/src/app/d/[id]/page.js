import Link from 'next/link'
import Layout from '@/components/Layout'
import PaperHeader from '@/components/PaperHeader'
import PaperSidebar from '@/components/PaperSidebar'
import DiscussionComments from './DiscussionComments'
import styles from './Discussion.module.css'

async function getDiscussionData(id) {
  try {
    const res = await fetch(`${process.env.API_URL}/discussions/${id}/paper`, {
      cache: 'no-store'
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Failed to fetch discussion data:', error)
    return null
  }
}

export async function generateMetadata({ params }) {
  const { id } = await params
  const data = await getDiscussionData(id)
  if (!data || data.error) {
    return {
      title: 'Discussion — PostScholar',
      description: 'Academic discussion on PostScholar'
    }
  }

  const { paper } = data
  const authors = paper.authors_json?.map(a => `${a.given} ${a.family}`).join(', ') || ''
  const title = paper.title ? `${paper.title} — PostScholar` : 'Discussion — PostScholar'
  const description = paper.abstract
    ? paper.abstract.slice(0, 160)
    : `Discussion of "${paper.title}" on PostScholar`

  return {
    title,
    description,
    openGraph: {
      title: paper.title,
      description: paper.abstract?.slice(0, 200) || description,
      type: 'article',
      authors: authors ? [authors] : undefined,
    },
    twitter: {
      card: 'summary',
      title: paper.title,
      description: paper.abstract?.slice(0, 200) || description,
    },
  }
}

export default async function DiscussionPage({ params }) {
  const { id } = await params
  const data = await getDiscussionData(id)

  if (!data || data.error) {
    return (
      <Layout>
        <p className={styles.error}>Discussion not found.</p>
      </Layout>
    )
  }

  const { paper, started_by, discussion_created_at, custom_tags } = data

  const sidebar = paper ? <PaperSidebar paper={paper} discussionId={id} /> : null

  return (
    <Layout sidebar={sidebar}>
      <Link href="/explore" className="backLink">← Discussions</Link>
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