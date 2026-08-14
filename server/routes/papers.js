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
  return { title, authors, journal, year, abstract, suggestedTopics: [] }
}

/**
 * arXiv category code to topic slug mapping.
 * Maps arXiv subject classifications to our existing topic taxonomy.
 * Only includes categories we have corresponding topics for.
 */
const ARXIV_TOPIC_MAP = {
  // Computer Science
  'cs.AI': 'artificial-intelligence',
  'cs.LG': 'machine-learning',
  'cs.CL': 'linguistics',              // NLP/Computational Linguistics
  'cs.CV': 'computer-science-ai',       // Computer Vision (no specific slug, use parent)
  'cs.HC': 'human-computer-interaction',
  'cs.CR': 'cybersecurity',             // Cryptography & Security
  'cs.NI': 'systems-networking',        // Networking
  'cs.DC': 'systems-networking',        // Distributed Computing
  'cs.PL': 'programming-languages',
  'cs.RO': 'robotics',
  'cs.SY': 'systems-networking',        // Systems & Control

  // Mathematics
  'math.CO': 'pure-mathematics',        // Combinatorics
  'math.NT': 'pure-mathematics',        // Number Theory
  'math.AG': 'pure-mathematics',        // Algebraic Geometry
  'math.AP': 'applied-mathematics',     // Analysis of PDEs
  'math.OC': 'applied-mathematics',     // Optimization & Control
  'math.NA': 'computational-mathematics', // Numerical Analysis
  'math.PR': 'statistics-probability',  // Probability
  'math.ST': 'statistics-probability',  // Statistics

  // Physics
  'physics.comp-ph': 'physics',         // Computational Physics
  'astro-ph': 'astronomy-astrophysics',
  'cond-mat': 'materials-science',      // Condensed Matter
  'quant-ph': 'quantum-science',

  // Biology/Life Sciences
  'q-bio.GN': 'genetics',               // Genomics
  'q-bio.MN': 'molecular-biology',      // Molecular Networks
  'q-bio.NC': 'neuroscience',           // Neurons & Cognition
  'q-bio.PE': 'ecology',                // Populations & Evolution
  'q-bio.CB': 'cell-biology',

  // Economics
  'econ.EM': 'macroeconomics',          // Econometrics (closer to macro)
  'econ.TH': 'microeconomics',          // Theoretical Economics

  // Statistics
  'stat.ML': 'machine-learning',        // Machine Learning (stat)
  'stat.TH': 'statistics-probability',  // Theory
  'stat.CO': 'computational-mathematics', // Computation
}

/**
 * extractTopicSlugsFromDataCite(attributes)
 * Extracts suggested topic slugs from DataCite subjects array.
 * Prioritizes arXiv category codes, falls back to FOS classifications.
 */
function extractTopicSlugsFromDataCite(attributes) {
  const suggestedSlugs = []

  if (!Array.isArray(attributes.subjects)) {
    return suggestedSlugs
  }

  // First pass: look for arXiv category codes
  for (const subj of attributes.subjects) {
    if (subj.subjectScheme === 'arXiv' && subj.subject) {
      // Extract category code from format like "Computation and Language (cs.CL)"
      const match = subj.subject.match(/\(([^)]+)\)/)
      if (match) {
        const code = match[1]
        const slug = ARXIV_TOPIC_MAP[code]
        if (slug && !suggestedSlugs.includes(slug)) {
          suggestedSlugs.push(slug)
        }
      }
    }
  }

  // Second pass: use FOS as fallback if no arXiv categories matched
  if (suggestedSlugs.length === 0) {
    for (const subj of attributes.subjects) {
      if (subj.subjectScheme === 'Fields of Science and Technology (FOS)') {
        // Map broad FOS categories to our topics
        if (subj.subject.includes('Computer and information sciences')) {
          suggestedSlugs.push('computer-science-ai')
        } else if (subj.subject.includes('Biological sciences')) {
          suggestedSlugs.push('life-sciences')
        } else if (subj.subject.includes('Physical sciences')) {
          suggestedSlugs.push('physical-sciences')
        } else if (subj.subject.includes('Mathematics')) {
          suggestedSlugs.push('mathematics')
        } else if (subj.subject.includes('Engineering')) {
          suggestedSlugs.push('engineering-technology')
        } else if (subj.subject.includes('Medical and health sciences')) {
          suggestedSlugs.push('medicine-health')
        } else if (subj.subject.includes('Social sciences')) {
          suggestedSlugs.push('social-sciences')
        } else if (subj.subject.includes('Economics')) {
          suggestedSlugs.push('economics-business')
        }
        break // Only use first FOS match
      }
    }
  }

  return suggestedSlugs
}

/**
 * normalizeDataCite(attributes)
 * Normalizes the raw DataCite API response into our schema shape.
 * DataCite is used for arXiv papers and other datasets not indexed by CrossRef.
 * Maps DataCite's structure to match CrossRef's output format.
 */
function normalizeDataCite(attributes) {
  const title = Array.isArray(attributes.titles) && attributes.titles.length > 0
    ? attributes.titles[0].title : null

  const authors = Array.isArray(attributes.creators)
    ? attributes.creators.map(c => ({
        given: c.givenName || null,
        family: c.familyName || null
      }))
    : []

  const journal = attributes.publisher || null

  const year = attributes.publicationYear || null

  let abstract = null
  if (Array.isArray(attributes.descriptions) && attributes.descriptions.length > 0) {
    const abstractDesc = attributes.descriptions.find(d => d.descriptionType === 'Abstract')
    abstract = abstractDesc?.description || null
  }

  const suggestedTopics = extractTopicSlugsFromDataCite(attributes)

  return { title, authors, journal, year, abstract, suggestedTopics }
}

async function fetchCrossRefPaper(doi) {
  // Try CrossRef first (works for most journal articles, most publishers)
  try {
    const crossrefUrl = `https://api.crossref.org/works/${encodeURIComponent(doi)}`
    const crossrefRes = await fetch(crossrefUrl, {
      headers: { 'User-Agent': 'PostScholar/1.0 (mailto:hello@postscholar.org)' }
    })

    if (crossrefRes.ok) {
      const crossrefData = await crossrefRes.json()
      const work = crossrefData?.message
      if (work) {
        const paper = normalizeCrossRef(work)
        if (paper.title) {
          return { found: true, paper, source: 'crossref' }
        }
      }
    }

    // If CrossRef returns 404, fall back to DataCite
    // This handles arXiv papers (DOI prefix 10.48550) and other datasets.
    // arXiv DOIs are registered with DataCite, not CrossRef.
    // See: https://community.crossref.org/t/known-working-doi-gives-resource-not-found-in-crossref-api/4111
    if (crossrefRes.status === 404) {
      const dataciteUrl = `https://api.datacite.org/dois/${encodeURIComponent(doi)}`
      const dataciteRes = await fetch(dataciteUrl, {
        headers: { 'User-Agent': 'PostScholar/1.0 (mailto:hello@postscholar.org)' }
      })

      if (dataciteRes.ok) {
        const dataciteData = await dataciteRes.json()
        const attributes = dataciteData?.data?.attributes
        if (attributes) {
          const paper = normalizeDataCite(attributes)
          if (paper.title) {
            return { found: true, paper, source: 'datacite' }
          }
        }
      }

      if (dataciteRes.status === 404) {
        return { found: false }
      }

      return { found: false, lookupFailed: true }
    }

    if (!crossrefRes.ok) return { found: false, lookupFailed: true }

    return { found: false }
  } catch {
    return { found: false, lookupFailed: true }
  }
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
    const crossrefPaper = await fetchCrossRefPaper(doi)
    if (!crossrefPaper.found) {
      return res.json({
        found: false,
        ...(crossrefPaper.lookupFailed ? { lookup_failed: true } : {}),
      })
    }

    const { title, authors, journal, year, abstract, suggestedTopics } = crossrefPaper.paper

    // Store the paper (no discussion created yet)
    const paperResult = await pool.query(
      `INSERT INTO papers (doi, title, authors_json, journal, year, abstract, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [doi, title, JSON.stringify(authors), journal, year, abstract, crossrefPaper.source]
    )

    return res.status(201).json({
      found: true,
      existed: false,
      paper: paperResult.rows[0],
      suggested_topics: suggestedTopics || []
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
    const { title, authors, journal, year, abstract, doi, paper_url } = req.body

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return res.status(400).json({ error: 'title is required' })
    }

    let normalizedDoi = null
    if (doi && typeof doi === 'string' && doi.trim()) {
      normalizedDoi = doi.trim().toLowerCase()
    }

    if (normalizedDoi) {
      const existingPaper = await pool.query(
        'SELECT id FROM papers WHERE doi = $1',
        [normalizedDoi]
      )
      if (existingPaper.rows.length > 0) {
        return res.status(409).json({
          error: 'A paper with this DOI already exists',
          code: 'DOI_ALREADY_EXISTS',
        })
      }

      const crossrefPaper = await fetchCrossRefPaper(normalizedDoi)
      if (crossrefPaper.found) {
        return res.status(409).json({
          error: 'This DOI exists on CrossRef. Use DOI lookup instead.',
          code: 'DOI_FOUND_ON_CROSSREF',
        })
      }
      if (crossrefPaper.lookupFailed) {
        return res.status(503).json({
          error: 'Could not verify DOI with CrossRef. Try again or remove the DOI to add a manual paper.',
          code: 'DOI_VERIFICATION_FAILED',
        })
      }
    }

    let normalizedUrl = null
    if (paper_url && typeof paper_url === 'string' && paper_url.trim()) {
      normalizedUrl = paper_url.trim()
      try {
        // Validate URL format when provided
        const parsed = new URL(normalizedUrl)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return res.status(400).json({ error: 'paper_url must be a valid URL' })
        }
      } catch {
        return res.status(400).json({ error: 'paper_url must be a valid URL' })
      }
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
      `INSERT INTO papers (doi, title, authors_json, journal, year, abstract, paper_url, source)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'manual')
       RETURNING *`,
      [
        normalizedDoi,
        title.trim(),
        JSON.stringify(authors_json),
        journal?.trim() || null,
        year ? parseInt(year) : null,
        abstract?.trim() || null,
        normalizedUrl,
      ]
    )

    return res.status(201).json({ paper: result.rows[0] })
  } catch (err) {
    console.error('POST /papers/manual error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router
module.exports.fetchCrossRefPaper = fetchCrossRefPaper
