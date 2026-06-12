import Layout from '@/components/Layout'
import ExploreFeed from './ExploreFeed'
import { getInitialFeedData } from '@/lib/feedData'
import { Suspense } from 'react'

export const metadata = {
  title: 'Explore discussions',
  description:
    'Browse active academic paper discussions on PostScholar. Filter by topic, sort by recent activity, and join the conversation.',
  alternates: {
    canonical: '/explore',
  },
  openGraph: {
    title: 'Explore discussions — PostScholar',
    description: 'Browse and join academic paper discussions.',
    url: '/explore',
  },
}

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const { discussions, topics, nextCursor, recentlyActive } =
    await getInitialFeedData()

  return (
    <Layout wide>
      <Suspense fallback={<p>Loading...</p>}>
        <ExploreFeed
          initialDiscussions={discussions}
          initialTopics={topics}
          initialNextCursor={nextCursor}
          initialRecentlyActive={recentlyActive}
        />
      </Suspense>
    </Layout>
  )
}
