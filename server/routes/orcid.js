const express = require('express')
const router = express.Router()
const jwt = require('jsonwebtoken')
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')

// ORCID OAuth endpoints
const ORCID_AUTH_URL = 'https://orcid.org/oauth/authorize'
const ORCID_TOKEN_URL = 'https://orcid.org/oauth/token'

// Short-lived JWT expiry for OAuth state parameter
const STATE_EXPIRY = '10m'

/**
 * signState(payload)
 * Signs a short-lived JWT to use as the OAuth state parameter.
 * The state carries the discussion_id and userId through the OAuth redirect
 * so we know which discussion to verify for and which user is verifying.
 * Using a signed JWT prevents CSRF — an attacker cannot forge a valid state.
 */
function signState(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: STATE_EXPIRY })
}

/**
 * verifyState(token)
 * Verifies and decodes the state JWT. Returns null if invalid or expired.
 */
function verifyState(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

/**
 * normalizeOrcidName(given, family)
 * Normalizes a name from ORCID into lowercase trimmed parts for comparison.
 * ORCID returns given (first) and family (last) name separately.
 */
function normalizeOrcidName(given, family) {
  return {
    given: (given || '').toLowerCase().trim(),
    family: (family || '').toLowerCase().trim()
  }
}

/**
 * matchesAuthor(orcidName, authors)
 * Checks if the ORCID name matches any author in the paper's authors_json.
 * Matching is done on family name exact match + given name starts-with check.
 * The starts-with check handles cases where CrossRef stores "John" but ORCID
 * has "John Michael" or vice versa.
 */
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

// ---------------------------------------------------------------------------
// GET /auth/orcid/url
// ---------------------------------------------------------------------------
// Protected. Returns the ORCID OAuth authorization URL for the client to
// redirect to. Accepts ?discussion_id= as a query parameter.
//
// The state parameter is a signed JWT containing { userId, discussion_id }.
// This survives the redirect and lets us verify who is authenticating and
// for which discussion, without storing anything server-side.
// ---------------------------------------------------------------------------
router.get('/url', authenticateToken, async (req, res) => {
  const { discussion_id } = req.query

  if (!discussion_id) {
    return res.status(400).json({ error: 'discussion_id is required' })
  }

  // Confirm the discussion exists
  const discussionCheck = await pool.query(
    'SELECT id FROM discussions WHERE id = $1',
    [discussion_id]
  )
  if (discussionCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Discussion not found' })
  }

  // Check if already verified for this discussion
  const existing = await pool.query(
    'SELECT id FROM author_verifications WHERE user_id = $1 AND discussion_id = $2',
    [req.user.userId, discussion_id]
  )
  if (existing.rows.length > 0) {
    return res.status(409).json({ error: 'Already verified as author for this discussion' })
  }

  // Build the state JWT
  const state = signState({ userId: req.user.userId, discussion_id })

  // Build the ORCID OAuth URL
  const params = new URLSearchParams({
    client_id: process.env.ORCID_CLIENT_ID,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: `${process.env.CLIENT_URL}/orcid/callback`,
    state
  })

  return res.json({ url: `${ORCID_AUTH_URL}?${params.toString()}` })
})

// ---------------------------------------------------------------------------
// POST /auth/orcid/callback
// ---------------------------------------------------------------------------
// Protected. Called by the frontend after ORCID redirects back with a code.
// Exchanges the code for an access token, retrieves the user's ORCID name,
// checks if it matches any author on the paper, and stores the verification.
//
// Body params:
//   code          (string) — the OAuth authorization code from ORCID
//   state         (string) — the signed state JWT from the initial redirect
//
// Flow:
//   1. Verify the state JWT → extract userId and discussion_id
//   2. Confirm the authenticated user matches the userId in state (CSRF check)
//   3. Exchange code for ORCID access token
//   4. Extract ORCID iD and name from token response
//   5. Fetch the paper's authors_json via the discussion
//   6. Check if ORCID name matches any author
//   7. If match → insert into author_verifications
//   8. Return { verified: true/false }
// ---------------------------------------------------------------------------
router.post('/callback', authenticateToken, async (req, res) => {
  try {
    const { code, state } = req.body

    if (!code || !state) {
      return res.status(400).json({ error: 'code and state are required' })
    }

    // Verify the state JWT
    const statePayload = verifyState(state)
    if (!statePayload) {
      return res.status(400).json({ error: 'Invalid or expired state' })
    }

    // CSRF check — the user in the cookie must match the user in the state
    if (statePayload.userId !== req.user.userId) {
      return res.status(403).json({ error: 'State mismatch' })
    }

    const { discussion_id } = statePayload

    // Check if already verified
    const existing = await pool.query(
      'SELECT id FROM author_verifications WHERE user_id = $1 AND discussion_id = $2',
      [req.user.userId, discussion_id]
    )
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Already verified as author for this discussion' })
    }

    // Exchange the authorization code for an access token
    const tokenRes = await fetch(ORCID_TOKEN_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json'
      },
      body: new URLSearchParams({
        client_id: process.env.ORCID_CLIENT_ID,
        client_secret: process.env.ORCID_CLIENT_SECRET,
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.CLIENT_URL}/orcid/callback`
      })
    })

    if (!tokenRes.ok) {
      return res.status(502).json({ error: 'Failed to exchange ORCID code' })
    }

    const tokenData = await tokenRes.json()

    // The token response contains the ORCID iD and name directly —
    // no need for a separate API call for basic verification
    const orcidId = tokenData.orcid
    const orcidGiven = tokenData.name?.given_names?.value || ''
    const orcidFamily = tokenData.name?.family_name?.value || ''

    if (!orcidId) {
      return res.status(502).json({ error: 'Could not retrieve ORCID iD' })
    }

    // Fetch the paper's authors via the discussion
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

    // Compare ORCID name against paper authors
    const orcidName = normalizeOrcidName(orcidGiven, orcidFamily)
    const isAuthor = matchesAuthor(orcidName, authors)

    if (!isAuthor) {
      return res.json({
        verified: false,
        reason: 'Your ORCID name does not match any author on this paper'
      })
    }

    // Store the verification
    await pool.query(
      `INSERT INTO author_verifications (user_id, discussion_id, orcid_id)
       VALUES ($1, $2, $3)`,
      [req.user.userId, discussion_id, orcidId]
    )

    return res.json({ verified: true, orcid_id: orcidId })
  } catch (err) {
    console.error('POST /auth/orcid/callback error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
