const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

/**
 * stripJats(text)
 * Strips JATS XML tags from CrossRef abstracts.
 */
function stripJats(text) {
  if (!text) return null
  return text.replace(/<[^>]+>/g, '').trim()
}

/**
 * normalizeCrossRef(work)
 * Normalizes the raw CrossRef API response into our schema shape.
 * Handles missing fields, array-wrapped values, and JATS XML.
 */
function normalizeCrossRef(work) {
  const title = Array.isArray(work.title) && work.title.length > 0
    ? work.title[0] : null

  const authors = Array.isArray(work.author)
    ? work.author.map(a => ({ given: a.given || null, family: a.family || null }))
    : []

  const journal = Array.isArray(work['container-title']) && work['container-title'].length > 0
    ? work['container-title'][0] : null

  let year = null
  if (work['published-print']?.['date-parts']?.[0]?.[0]) {
    year = work['published-print']['date-parts'][0][0]
  } else if (work['published-online']?.['date-parts']?.[0]?.[0]) {
    year = work['published-online']['date-parts'][0][0]
  } else if (work['created']?.['date-parts']?.[0]?.[0]) {
    year = work['created']['date-parts'][0][0]
  }

  const abstract = stripJats(work.abstract || null)
  return { title, authors, journal, year, abstract }
}

// ---------------------------------------------------------------------------
// POST /papers/lookup
// ---------------------------------------------------------------------------
// Protected. Looks up a DOI — fetches from CrossRef if not in DB, stores the
// paper, and returns paper data.
//
// IMPORTANT: This endpoint no longer creates a discussion. Discussion creation
// is handled separately by POST /discussions. This allows the user to review
// the paper and select topics before the discussion is created.
//
// Response shapes:
//   { found: true, existed: true,  paper }  — paper already in DB
//   { found: true, existed: false, paper }  — newly fetched from CrossRef
//   { found: false }                         — not on CrossRef
//
// If a discussion already exists for this paper, discussion_id is included
// so the client can redirect directly.
// ---------------------------------------------------------------------------
router.post('/lookup', authenticateToken, async (req, res) => {
  try {
    let { doi } = req.body
    if (!doi || typeof doi !== 'string') {
      return res.status(400).json({ error: 'doi is required' })
    }

    doi = doi.trim().toLowerCase()

    // Check if paper already exists
    const existingPaper = await pool.query(
      'SELECT * FROM papers WHERE doi = $1',
      [doi]
    )

    if (existingPaper.rows.length > 0) {
      const paper = existingPaper.rows[0]

      // Check if a discussion already exists for this paper
      const existingDiscussion = await pool.query(
        'SELECT id FROM discussions WHERE paper_id = $1',
        [paper.id]
      )

      return res.json({
        found: true,
        existed: true,
        paper,
        // If discussion exists, include its ID so client can redirect
        discussion_id: existingDiscussion.rows[0]?.id || null
      })
    }

    // Fetch from CrossRef — server-side only
    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    const crossrefRes = await fetch(crossrefUrl, {
      headers: { 'User-Agent': 'PostScholar/1.0 (mailto:hello@postscholar.org)' }
    })

    if (crossrefRes.status === 404) return res.json({ found: false })
    if (!crossrefRes.ok) return res.status(502).json({ error: 'CrossRef request failed' })

    const crossrefData = await crossrefRes.json()
    const work = crossrefData?.message
    if (!work) return res.json({ found: false })

    const { title, authors, journal, year, abstract } = normalizeCrossRef(work)
    if (!title) return res.json({ found: false })

    // Store the paper (no discussion created yet)
    const paperResult = await pool.query(
      `INSERT INTO papers (doi, title, authors_json, journal, year, abstract, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'crossref')
       RETURNING *`,
      [doi, title, JSON.stringify(authors), journal, year, abstract]
    )

    return res.status(201).json({
      found: true,
      existed: false,
      paper: paperResult.rows[0]
    })
  } catch (err) {
    console.error('POST /papers/lookup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /papers/*doi
// ---------------------------------------------------------------------------
// Public (optionalAuth). Returns a paper and its discussion ID by DOI.
// DOIs contain slashes — Express 5 wildcard splits them into an array.
// ---------------------------------------------------------------------------
router.get('/*doi', optionalAuth, async (req, res) => {
  try {
    const doi = Array.isArray(req.params.doi)
      ? req.params.doi.join('/').trim().toLowerCase()
      : req.params.doi?.toString().trim().toLowerCase()

    if (!doi) return res.status(400).json({ error: 'doi is required' })

    const result = await pool.query(
      `SELECT p.*, d.id AS discussion_id
       FROM papers p
       LEFT JOIN discussions d ON d.paper_id = p.id
       WHERE p.doi = $1`,
      [doi]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' })
    }

    const row = result.rows[0]
    return res.json({
      paper: {
        id: row.id, doi: row.doi, title: row.title,
        authors_json: row.authors_json, journal: row.journal,
        year: row.year, abstract: row.abstract,
        source: row.source, created_at: row.created_at
      },
      discussion_id: row.discussion_id
    })
  } catch (err) {
    console.error('GET /papers/* error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})


// ---------------------------------------------------------------------------
// POST /papers/manual
// ---------------------------------------------------------------------------
// Protected. Creates a paper from manually entered data when CrossRef
// returns no results. Authors are stored as a simple array of name strings
// parsed from a comma-separated input.
// ---------------------------------------------------------------------------
router.post('/manual', authenticateToken, async (req, res) => {
  try {
    const { title, authors, journal, year, abstract } = req.body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' })
    }

    // Parse authors string "Jane Smith, John Doe" into authors_json array
    const authors_json = authors
      ? authors.split(',').map(a => {
          const parts = a.trim().split(' ')
          const family = parts.pop() || ''
          const given = parts.join(' ')
          return { given: given || null, family: family || null }
        })
      : []

    const result = await pool.query(
      `INSERT INTO papers (doi, title, authors_json, journal, year, abstract, source)
       VALUES ($1, $2, $3, $4, $5, $6, 'manual')
       RETURNING *`,
      [
        null, // no DOI for manual entries
        title.trim(),
        JSON.stringify(authors_json),
        journal?.trim() || null,
        year ? parseInt(year) : null,
        abstract?.trim() || null
      ]
    )

    return res.status(201).json({ paper: result.rows[0] })
  } catch (err) {
    console.error('POST /papers/manual error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// ---------------------------------------------------------------------------
// GET /papers/metrics/*doi
// ---------------------------------------------------------------------------
// Public. Fetches citation count from OpenCitations API for a given DOI.
// Returns { citation_count } or { citation_count: null } if unavailable.
// ---------------------------------------------------------------------------
router.get('/metrics/*doi', async (req, res) => {
  try {
    const doi = Array.isArray(req.params.doi)
      ? req.params.doi.join('/').trim().toLowerCase()
      : req.params.doi?.toString().trim().toLowerCase()

    if (!doi) return res.status(400).json({ error: 'doi is required' })

    const openCitationsUrl = `https://opencitations.net/index/api/v1/citation-count/${encodeURIComponent(doi)}`
    const ocRes = await fetch(openCitationsUrl)

    if (!ocRes.ok) {
      return res.json({ citation_count: null })
    }

    const ocData = await ocRes.json()
    const citationCount = Array.isArray(ocData) && ocData[0]?.count
      ? parseInt(ocData[0].count)
      : null

    res.json({ citation_count: citationCount })
  } catch (err) {
    console.error('GET /papers/metrics/* error:', err)
    res.json({ citation_count: null })
  }
})

module.exports = router
