const pool = require('../db')

async function requireModerator(req, res, next) {
  try {
    const result = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [req.user.userId]
    )
    const role = result.rows[0]?.role
    if (role === 'moderator' || role === 'admin') {
      return next()
    }
    return res.status(403).json({ error: 'Moderator access required' })
  } catch (err) {
    console.error('requireModerator error:', err)
    res.status(500).json({ error: 'Internal server error' })
  }
}

module.exports = requireModerator
