const jwt = require('jsonwebtoken')

const JWT_EXPIRY = '7d'

function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRY })
}

function tokenCookieOptions(maxAge) {
  const isProd = process.env.NODE_ENV === 'production'
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    path: '/',
    maxAge,
  }
}

function setTokenCookie(res, token) {
  res.cookie('token', token, tokenCookieOptions(7 * 24 * 60 * 60 * 1000))
}

function clearTokenCookie(res) {
  res.cookie('token', '', tokenCookieOptions(0))
}

function signOAuthState(payload, expiresIn = '10m') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })
}

function verifyOAuthState(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function signCompletionToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30m' })
}

function verifyCompletionToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

module.exports = {
  signToken,
  setTokenCookie,
  clearTokenCookie,
  signOAuthState,
  verifyOAuthState,
  signCompletionToken,
  verifyCompletionToken,
  JWT_EXPIRY,
}
