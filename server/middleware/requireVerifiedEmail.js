const pool = require('../db')

/**
 * Blocks posting for local email/password users until email is verified.
 * OAuth and ORCID-linked users may post without email verification.
 */
async function requireVerifiedEmail(req, res, next) {
  try {
    const result = await pool.query(
      `SELECT email_verified, google_id, github_id, orcid_id
       FROM users WHERE id = $1`,
      [req.user.userId]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    if (user.google_id || user.github_id || user.orcid_id) {
      return next()
    }

    if (!user.email_verified) {
      return res.status(403).json({
        error: 'Please verify your email before posting',
        code: 'EMAIL_UNVERIFIED',
      })
    }

    return next()
  } catch (err) {
    console.error('requireVerifiedEmail error:', err)
    return res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = requireVerifiedEmail
