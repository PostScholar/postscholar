import { getServerApiUrl } from './config'

export async function getDiscussionPaper(id) {
  try {
    const res = await fetch(`${getServerApiUrl()}/discussions/${id}/paper`, {
      cache: 'no-store',
    })
    if (!res.ok) return null
    return res.json()
  } catch (error) {
    console.error('Failed to fetch discussion paper:', error)
    return null
  }
}

export async function getDiscussionStats(id) {
  try {
    const res = await fetch(`${getServerApiUrl()}/discussions/${id}/stats`, {
      cache: 'no-store',
    })
    if (!res.ok) return { view_count: 0, comment_count: 0 }
    return res.json()
  } catch (error) {
    console.error('Failed to fetch discussion stats:', error)
    return { view_count: 0, comment_count: 0 }
  }
}

export async function getDiscussionComments(id, sort = 'oldest') {
  try {
    const params = new URLSearchParams()
    if (sort && sort !== 'oldest') params.set('sort', sort)
    const query = params.toString() ? `?${params.toString()}` : ''
    const res = await fetch(
      `${getServerApiUrl()}/discussions/${id}/comments${query}`,
      { cache: 'no-store' }
    )
    if (!res.ok) return { comments: [], next_cursor: null }
    return res.json()
  } catch (error) {
    console.error('Failed to fetch discussion comments:', error)
    return { comments: [], next_cursor: null }
  }
}
