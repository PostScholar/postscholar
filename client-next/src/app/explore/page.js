import Layout from '@/components/Layout'
import ExploreFeed from './ExploreFeed'
import { getInitialFeedData } from '@/lib/feedData'
import { Suspense } from 'react'

export const metadata = {
  title: 'Explore discussions — PostScholar',
}

export const dynamic = 'force-dynamic'

export default async function ExplorePage() {
  const { discussions, topics, nextCursor } = await getInitialFeedData()

  return (
    <Layout wide>
      <Suspense fallback={<p>Loading...</p>}>
        <ExploreFeed
          initialDiscussions={discussions}
          initialTopics={topics}
          initialNextCursor={nextCursor}
        />
      </Suspense>
    </Layout>
  )
}
