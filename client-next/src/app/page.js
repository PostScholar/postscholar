import Layout from '@/components/Layout'
import HomeFeed from './HomeFeed'

export const metadata = {
  title: 'PostScholar — Academic discussion for published research',
}

async function getInitialData() {
  try {
    // Fetch initial discussions and topics
    const [discussionsRes, topicsRes] = await Promise.all([
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/explore`, {
        cache: 'no-store'
      }),
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/topics`, {
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

export default async function HomePage() {
  const { discussions, topics } = await getInitialData()

  return (
    <Layout>
      <HomeFeed
        initialDiscussions={discussions}
        initialTopics={topics}
      />
    </Layout>
  )
}