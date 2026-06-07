import Link from 'next/link'
import Layout from '@/components/Layout'
import ExploreFeed from './ExploreFeed'

export const metadata = {
  title: 'Explore discussions — PostScholar',
}

async function getInitialData() {
  try {
    // Fetch initial discussions and topics
    const [discussionsRes, topicsRes] = await Promise.all([
      fetch(`${process.env.API_URL}/explore`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.API_URL}/topics`, {
        cache: 'no-store'
      })
    ])

    const [discussionsData, topicsData] = await Promise.all([
      discussionsRes.ok ? discussionsRes.json() : { discussions: [] },
      topicsRes.ok ? topicsRes.json() : { topics: [] }
    ])

    return {
      discussions: discussionsData.discussions || [],
      topics: topicsData.topics || []
    }
  } catch (error) {
    console.error('Failed to fetch initial data:', error)
    return {
      discussions: [],
      topics: []
    }
  }
}

export default async function ExplorePage() {
  const { discussions, topics } = await getInitialData()

  return (
    <Layout>
      <Link href="/" className="backLink">← Home</Link>
      <ExploreFeed
        initialDiscussions={discussions}
        initialTopics={topics}
      />
    </Layout>
  )
}
