const jwt = require('jsonwebtoken')

module.exports = function authenticateToken(req, res, next) {
  const token = req.cookies?.token
  if (!token) return res.status(401).json({ error: 'Not authenticated' })

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({ error: 'Not authenticated' })
  }
}