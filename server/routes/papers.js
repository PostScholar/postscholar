const express = require('express')
const router = express.Router()
const pool = require('../db')
const authenticateToken = require('../middleware/authenticateToken')
const optionalAuth = require('../middleware/optionalAuth')

// Strip JATS XML tags from CrossRef abstracts
function stripJats(text) {
  if (!text) return null
  return text.replace(/<[^>]+>/g, '').trim()
}

// Normalize raw CrossRef work object into our schema shape
function normalizeCrossRef(work) {
  const title = Array.isArray(work.title) && work.title.length > 0
    ? work.title[0]
    : null

  const authors = Array.isArray(work.author)
    ? work.author.map(a => ({
        given: a.given || null,
        family: a.family || null
      }))
    : []

  const journal = Array.isArray(work['container-title']) && work['container-title'].length > 0
    ? work['container-title'][0]
    : null

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

// POST /papers/lookup
// Requires login. Takes a DOI, fetches from CrossRef, stores paper + discussion.
router.post('/lookup', authenticateToken, async (req, res) => {
  try {
    let { doi } = req.body
    if (!doi || typeof doi !== 'string') {
      return res.status(400).json({ error: 'doi is required' })
    }

    doi = doi.trim().toLowerCase()

    // If paper already exists return it with its discussion
    const existing = await pool.query(
      `SELECT p.*, d.id AS discussion_id
       FROM papers p
       JOIN discussions d ON d.paper_id = p.id
       WHERE p.doi = $1`,
      [doi]
    )
    if (existing.rows.length > 0) {
      const row = existing.rows[0]
      return res.json({
        found: true,
        existed: true,
        paper: {
          id: row.id,
          doi: row.doi,
          title: row.title,
          authors_json: row.authors_json,
          journal: row.journal,
          year: row.year,
          abstract: row.abstract,
          source: row.source,
          created_at: row.created_at
        },
        discussion_id: row.discussion_id
      })
    }

    // Fetch from CrossRef
    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    const crossrefRes = await fetch(crossrefUrl, {
      headers: {
        'User-Agent': 'PostScholar/1.0 (mailto:hello@postscholar.org)'
      }
    })

    if (crossrefRes.status === 404) {
      return res.json({ found: false })
    }

    if (!crossrefRes.ok) {
      return res.status(502).json({ error: 'CrossRef request failed' })
    }

    const crossrefData = await crossrefRes.json()
    const work = crossrefData?.message
    if (!work) {
      return res.json({ found: false })
    }

    const { title, authors, journal, year, abstract } = normalizeCrossRef(work)

    if (!title) {
      return res.json({ found: false })
    }

    // Insert paper and discussion in a transaction
    const client = await pool.connect()
    try {
      await client.query('BEGIN')

      const paperResult = await client.query(
        `INSERT INTO papers (doi, title, authors_json, journal, year, abstract, source)
         VALUES ($1, $2, $3, $4, $5, $6, 'crossref')
         RETURNING *`,
        [doi, title, JSON.stringify(authors), journal, year, abstract]
      )
      const paper = paperResult.rows[0]

      const discussionResult = await client.query(
        `INSERT INTO discussions (paper_id, created_by)
         VALUES ($1, $2)
         RETURNING id`,
        [paper.id, req.user.id]
      )
      const discussion_id = discussionResult.rows[0].id

      await client.query('COMMIT')

      return res.status(201).json({
        found: true,
        existed: false,
        paper,
        discussion_id
      })
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  } catch (err) {
    console.error('POST /papers/lookup error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// GET /papers/*
// Public. Returns paper + discussion ID by DOI.
// Wildcard needed because DOIs contain slashes.
router.get('/*doi', optionalAuth, async (req, res) => {
  try {
    const doi = Array.isArray(req.params.doi)
  ? req.params.doi.join('/').trim().toLowerCase()
  : req.params.doi?.toString().trim().toLowerCase()
// console.log('doi param:', req.params.doi) 
// Express 5 changed how wildcard routes work. In Express 4, /* captured the entire path as a single string in req.params[0]. In Express 5, /*doi splits on each / and returns an array. So 10.1145/3290605.3300651 came back as ['10.1145', '3290605.3300651'] instead of the full string. Joining the array with / reconstructed it correctly.
    if (!doi) {
      return res.status(400).json({ error: 'doi is required' })
    }

    const result = await pool.query(
      `SELECT p.*, d.id AS discussion_id
       FROM papers p
       JOIN discussions d ON d.paper_id = p.id
       WHERE p.doi = $1`,
      [doi]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Paper not found' })
    }

    const row = result.rows[0]
    return res.json({
      paper: {
        id: row.id,
        doi: row.doi,
        title: row.title,
        authors_json: row.authors_json,
        journal: row.journal,
        year: row.year,
        abstract: row.abstract,
        source: row.source,
        created_at: row.created_at
      },
      discussion_id: row.discussion_id
    })
  } catch (err) {
    console.error('GET /papers/* error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router

