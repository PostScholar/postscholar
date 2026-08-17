const jwt = require('jsonwebtoken')
const pool = require('../db')

module.exports = async function authenticateToken(req, res, next) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)

    const result = await pool.query(
      'SELECT deleted_at FROM users WHERE id = $1',
      [req.user.userId]
    )

    if (result.rows.length === 0 || result.rows[0].deleted_at !== null) {
      return res.status(401).json({ error: 'Account has been deleted' })
    }

    next()
  } catch {
    return res.status(401).json({ error: 'Not authenticated' })
  }
}