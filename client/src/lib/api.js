const BASE_URL = import.meta.env.VITE_API_URL

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
export function getComments(discussionId, cursor = null) {
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''
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
