const BASE_URL = process.env.NEXT_PUBLIC_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'request failed')
  }

  return res.json()
}

export const api = {
  get:    (path)        => request(path),
  post:   (path, body)  => request(path, { method: 'POST',   body: JSON.stringify(body) }),
  patch:  (path, body)  => request(path, { method: 'PATCH',  body: JSON.stringify(body) }),
  put:    (path, body)  => request(path, { method: 'PUT',    body: JSON.stringify(body) }),
  delete: (path)        => request(path, { method: 'DELETE' }),
}

// ---------------------------------------------------------------------------
// Papers
// ---------------------------------------------------------------------------

/**
 * Look up a paper by DOI. Creates a discussion if the paper is new.
 * Returns { found, existed, paper, discussion_id } or { found: false }
 */
export function lookupPaper(doi) {
  return api.post('/papers/lookup', { doi })
}

/**
 * Fetch a paper and its discussion ID by DOI.
 * Returns { paper, discussion_id }
 */
export function getPaperByDoi(doi) {
  return api.get(`/papers/${doi}`)
}

// ---------------------------------------------------------------------------
// Discussions
// ---------------------------------------------------------------------------

/**
 * Fetch paginated comments for a discussion.
 * Returns { comments, next_cursor }
 */
export function getComments(discussionId, cursor = null, sort = 'oldest') {
  const params = new URLSearchParams()
  if (cursor) params.set('cursor', cursor)
  if (sort && sort !== 'oldest') params.set('sort', sort)
  const query = params.toString() ? `?${params.toString()}` : ''
  return api.get(`/discussions/${discussionId}/comments${query}`)
}

/**
 * Search comments in a discussion by keyword.
 * Returns { results }
 */
export function searchComments(discussionId, q) {
  return api.get(`/discussions/${discussionId}/comments/search?q=${encodeURIComponent(q)}`)
}

/**
 * Post a new comment or reply.
 * Pass parent_comment_id to reply, omit for top-level.
 * Returns { comment }
 */
export function postComment(discussionId, body, parentCommentId = null) {
  return api.post(`/discussions/${discussionId}/comments`, {
    body,
    ...(parentCommentId ? { parent_comment_id: parentCommentId } : {})
  })
}

/**
 * Edit a comment body.
 * Returns { comment }
 */
export function editComment(commentId, body) {
  return api.patch(`/discussions/comments/${commentId}`, { body })
}

/**
 * Delete a comment (and all its replies via cascade).
 * Returns { deleted: true }
 */
export function deleteComment(commentId) {
  return api.delete(`/discussions/comments/${commentId}`)
}

/**
 * Delete an entire discussion. Creator only.
 * Returns { deleted: true }
 */
export function deleteDiscussion(discussionId) {
  return api.delete(`/discussions/${discussionId}`)
}

// ---------------------------------------------------------------------------
// ORCID
// ---------------------------------------------------------------------------

/**
 * Get the ORCID OAuth URL for a discussion.
 * Returns { url } — redirect the user there.
 */
export function getOrcidUrl(discussionId) {
  return api.get(`/auth/orcid/url?discussion_id=${discussionId}`)
}

/**
 * Exchange ORCID OAuth code + state for author verification.
 * Returns { verified: true/false, orcid_id?, reason? }
 */
export function submitOrcidCallback(code, state) {
  return api.post('/auth/orcid/callback', { code, state })
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export function forgotPassword(email) {
  return api.post('/auth/forgot-password', { email })
}

export function resetPassword(token, password) {
  return api.post('/auth/reset-password', { token, password })
}

// ---------------------------------------------------------------------------
// Users / Profiles
// ---------------------------------------------------------------------------

export function getProfile(username) {
  return api.get(`/users/${username}`)
}

export function updateProfile(data) {
  return api.patch('/users/me', data)
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export function searchDiscussions(q) {
  return api.get(`/search?q=${encodeURIComponent(q)}`)
}

// ---------------------------------------------------------------------------
// Bookmarks
// ---------------------------------------------------------------------------

export function createBookmark(discussionId) {
  return api.post('/bookmarks', { discussionId })
}

export function removeBookmark(discussionId) {
  return api.delete(`/bookmarks/${discussionId}`)
}

export function getBookmarks() {
  return api.get('/bookmarks')
}

export function checkBookmark(discussionId) {
  return api.get(`/bookmarks/check/${discussionId}`)
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export function submitReport({ comment_id, discussion_id, reason, description }) {
  return api.post('/reports', { comment_id, discussion_id, reason, description })
}

export function getReports(status = 'pending') {
  return api.get(`/reports?status=${encodeURIComponent(status)}`)
}

export function updateReportStatus(reportId, status) {
  return api.patch(`/reports/${reportId}`, { status })
}

// ---------------------------------------------------------------------------
// Follows
// ---------------------------------------------------------------------------

export function followUser(username) {
  return api.post(`/follows/${username}`)
}

export function unfollowUser(username) {
  return api.delete(`/follows/${username}`)
}

export function getFollowStatus(username) {
  return api.get(`/follows/${username}/status`)
}

export function getFollowCounts(username) {
  return api.get(`/follows/${username}/counts`)
}

export function getFollowers(username) {
  return api.get(`/follows/${username}/followers`)
}

export function getFollowing(username) {
  return api.get(`/follows/${username}/following`)
}

// ---------------------------------------------------------------------------
// View Tracking
// ---------------------------------------------------------------------------

export function trackView(discussionId) {
  return api.post(`/discussions/${discussionId}/view`)
}

export function getDiscussionStats(discussionId) {
  return api.get(`/discussions/${discussionId}/stats`)
}

// ---------------------------------------------------------------------------
// Paper Metrics
// ---------------------------------------------------------------------------

export function getPaperMetrics(doi) {
  return api.get(`/papers/metrics/${doi}`)
}