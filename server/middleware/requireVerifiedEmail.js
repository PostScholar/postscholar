const pool = require('../db')

/**
 * Blocks posting until the account's stored email identity is verified.
 */
async function requireVerifiedEmail(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT email_verified FROM users WHERE id = $1',
      [req.user.userId]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' })
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
