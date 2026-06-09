import { getServerApiUrl } from './config'

export async function getInitialFeedData() {
  const baseUrl = getServerApiUrl()

  try {
    const [discussionsRes, topicsRes] = await Promise.all([
      fetch(`${baseUrl}/explore`, { cache: 'no-store' }),
      fetch(`${baseUrl}/topics`, { cache: 'no-store' }),
    ])

    const [discussionsData, topicsData] = await Promise.all([
      discussionsRes.ok ? discussionsRes.json() : { discussions: [] },
      topicsRes.ok ? topicsRes.json() : { topics: [] },
    ])

    return {
      discussions: discussionsData.discussions || [],
      topics: topicsData.topics || [],
      nextCursor: discussionsData.next_cursor || null,
    }
  } catch (error) {
    console.error('Failed to fetch initial feed data:', error)
    return {
      discussions: [],
      topics: [],
      nextCursor: null,
    }
  }
}
