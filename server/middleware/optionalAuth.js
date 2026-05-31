const jwt = require('jsonwebtoken')

module.exports = function optionalAuth(req, res, next) {
  const token = req.cookies?.token
  if (!token) {
    req.user = null
    return next()
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    req.user = null
  }
  next()
}