const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const {
  signToken,
  setTokenCookie,
  signOAuthState,
  verifyOAuthState,
  signCompletionToken,
} = require('../lib/session')
const { formatUserResponse } = require('../lib/oauthUsers')

const ORCID_AUTH_URL = 'https://orcid.org/oauth/authorize'
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token'
const STATE_EXPIRY = '10m'

function signState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: STATE_EXPIRY })
}

function verifyState(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function normalizeOrcidName(given, family) {
  return {
    given: (given || '').toLowerCase().trim(),
    family: (family || '').toLowerCase().trim(),
  }
}

function matchesAuthor(orcidName, authors) {
  for (const author of authors) {
    const authorFamily = (author.family || '').toLowerCase().trim()
    const authorGiven = (author.given || '').toLowerCase().trim()
    const familyMatch = authorFamily === orcidName.family
    const givenMatch =
      authorGiven.startsWith(orcidName.given) ||
      orcidName.given.startsWith(authorGiven)
    if (familyMatch && givenMatch) return true
  }
  return false
}

function buildOrcidAuthUrl(state) {
  const params = new URLSearchParams({
    client_id: process.env.ORCID_CLIENT_ID,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: `${process.env.CLIENT_URL}/orcid/callback`,
    state,
  })
  return `${ORCID_AUTH_URL}?${params.toString()}`
}

async function exchangeOrcidCode(code) {
  const tokenRes = await fetch(ORCID_TOKEN_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: process.env.ORCID_CLIENT_ID,
      client_secret: process.env.ORCID_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.CLIENT_URL}/orcid/callback`,
    }),
  })

  if (!tokenRes.ok) return null
  return tokenRes.json()
}

// GET /auth/orcid/login/url
router.get('/login/url', (req, res) => {
  if (!process.env.ORCID_CLIENT_ID) {
    return res.status(503).json({ error: 'ORCID sign-in is not configured' })
  }
  const state = signOAuthState({ mode: 'login', provider: 'orcid' })
  return res.json({ url: buildOrcidAuthUrl(state) })
})

// GET /auth/orcid/link/url — link ORCID to existing account
router.get('/link/url', authenticateToken, (req, res) => {
  if (!process.env.ORCID_CLIENT_ID) {
    return res.status(503).json({ error: 'ORCID sign-in is not configured' })
  }
  const state = signOAuthState({
    mode: 'link',
    provider: 'orcid',
    userId: req.user.userId,
  })
  return res.json({ url: buildOrcidAuthUrl(state) })
})

// GET /auth/orcid/url?discussion_id=... (author verify — requires auth)
router.get('/url', authenticateToken, async (req, res) => {
  const { discussion_id } = req.query

  if (!discussion_id) {
    return res.status(400).json({ error: 'discussion_id is required' })
  }

  const discussionCheck = await pool.query(
    'SELECT id FROM discussions WHERE id = $1',
    [discussion_id]
  )
  if (discussionCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  const existing = await pool.query(
    'SELECT id FROM author_verifications WHERE user_id = $1 AND discussion_id = $2',
    [req.user.userId, discussion_id]
  )
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Already verified as author for this discussion' })
  }

  const state = signState({ mode: 'verify', userId: req.user.userId, discussion_id })
  return res.json({ url: buildOrcidAuthUrl(state) })
})

// POST /auth/orcid/callback — handles login and verify modes
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body

    if (!code || !state) {
      return res.status(400).json({ error: 'code and state are required' })
    }

    const statePayload = verifyOAuthState(state) || verifyState(state)
    if (!statePayload) {
      return res.status(400).json({ error: 'Invalid or expired state' })
    }

    const tokenData = await exchangeOrcidCode(code)
    if (!tokenData) {
      return res.status(502).json({ error: 'Failed to exchange ORCID code' })
    }

    const orcidId = tokenData.orcid
    const orcidGiven = tokenData.name?.given_names?.value || ''
    const orcidFamily = tokenData.name?.family_name?.value || ''
    const displayName = [orcidGiven, orcidFamily].filter(Boolean).join(' ').trim() || null

    if (!orcidId) {
      return res.status(502).json({ error: 'Could not retrieve ORCID iD' })
    }

    if (statePayload.mode === 'login') {
      return handleOrcidLogin(req, res, { orcidId, displayName })
    }

    if (statePayload.mode === 'link') {
      return handleOrcidLink(req, res, { statePayload, orcidId, displayName })
    }

    return handleOrcidVerify(req, res, {
      statePayload,
      orcidId,
      orcidGiven,
      orcidFamily,
    })
  } catch (err) {
    console.error('POST /auth/orcid/callback error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

async function handleOrcidLogin(req, res, { orcidId, displayName }) {
  const existing = await pool.query(
    `SELECT id, username, email, display_name, role, email_verified, orcid_id
     FROM users WHERE orcid_id = $1`,
    [orcidId]
  )

  if (existing.rows[0]) {
    const user = existing.rows[0]
    const sessionToken = signToken({ userId: user.id, username: user.username })
    setTokenCookie(res, sessionToken)
    return res.json({ ...formatUserResponse(user), mode: 'login' })
  }

  const completionToken = signCompletionToken({
    mode: 'orcid_complete',
    orcid_id: orcidId,
    display_name: displayName,
    email: null,
  })

  return res.json({
    needs_completion: true,
    completion_token: completionToken,
    display_name: displayName,
    mode: 'login',
  })
}

async function handleOrcidLink(req, res, { statePayload, orcidId, displayName }) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ error: 'Authentication required' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid session' })
  }

  if (statePayload.userId !== decoded.userId) {
    return res.status(403).json({ error: 'State mismatch' })
  }

  const taken = await pool.query(
    'SELECT id FROM users WHERE orcid_id = $1 AND id != $2',
    [orcidId, decoded.userId]
  )
  if (taken.rows.length > 0) {
    return res.status(409).json({
      error: 'This ORCID iD is already linked to another PostScholar account',
    })
  }

  const current = await pool.query(
    'SELECT orcid_id FROM users WHERE id = $1',
    [decoded.userId]
  )
  if (current.rows[0]?.orcid_id) {
    return res.status(400).json({ error: 'ORCID already linked to your account' })
  }

  await pool.query(
    `UPDATE users
     SET orcid_id = $1,
         display_name = COALESCE(display_name, $2)
     WHERE id = $3`,
    [orcidId, displayName, decoded.userId]
  )

  return res.json({ linked: true, provider: 'orcid', orcid_id: orcidId, mode: 'link' })
}

async function handleOrcidVerify(req, res, { statePayload, orcidId, orcidGiven, orcidFamily }) {
  const token = req.cookies?.token
  if (!token) {
    return res.status(401).json({ error: 'Authentication required for author verification' })
  }

  let decoded
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Invalid session' })
  }

  if (statePayload.userId !== decoded.userId) {
    return res.status(403).json({ error: 'State mismatch' })
  }

  const { discussion_id } = statePayload

  const existing = await pool.query(
    'SELECT id FROM author_verifications WHERE user_id = $1 AND discussion_id = $2',
    [decoded.userId, discussion_id]
  )
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Already verified as author for this discussion' })
  }

  const paperResult = await pool.query(
    `SELECT p.authors_json FROM papers p
     JOIN discussions d ON d.paper_id = p.id
     WHERE d.id = $1`,
    [discussion_id]
  )

  if (paperResult.rows.length === 0) {
    return res.status(404).json({ error: 'Discussion or paper not found' })
  }

  const authors = paperResult.rows[0].authors_json
  const orcidName = normalizeOrcidName(orcidGiven, orcidFamily)
  const isAuthor = matchesAuthor(orcidName, authors)

  if (!isAuthor) {
    return res.json({
      verified: false,
      reason: 'Your ORCID name does not match any author on this paper',
      mode: 'verify',
    })
  }

  await pool.query(
    'UPDATE users SET orcid_id = COALESCE(orcid_id, $1) WHERE id = $2',
    [orcidId, decoded.userId]
  )

  await pool.query(
    `INSERT INTO author_verifications (user_id, discussion_id, orcid_id)
     VALUES ($1, $2, $3)`,
    [decoded.userId, discussion_id, orcidId]
  )

  return res.json({ verified: true, orcid_id: orcidId, mode: 'verify' })
}

module.exports = router
