import { getServerApiUrl } from './config'

export async function getInitialFeedData() {
  const baseUrl = getServerApiUrl()

  try {
    const [discussionsRes, topicsRes, activeRes] = await Promise.all([
      fetch(`${baseUrl}/explore`, { cache: 'no-store' }),
      fetch(`${baseUrl}/topics`, { cache: 'no-store' }),
      fetch(`${baseUrl}/explore/active?limit=6`, { cache: 'no-store' }),
    ])

    const [discussionsData, topicsData, activeData] = await Promise.all([
      discussionsRes.ok ? discussionsRes.json() : { discussions: [] },
      topicsRes.ok ? topicsRes.json() : { topics: [] },
      activeRes.ok ? activeRes.json() : { discussions: [] },
    ])

    return {
      discussions: discussionsData.discussions || [],
      topics: topicsData.topics || [],
      nextCursor: discussionsData.next_cursor || null,
      recentlyActive: activeData.discussions || [],
    }
  } catch (error) {
    console.error('Failed to fetch initial feed data:', error)
    return {
      discussions: [],
      topics: [],
      nextCursor: null,
      recentlyActive: [],
    }
  }
}
