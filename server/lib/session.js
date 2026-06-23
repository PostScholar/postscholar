const crypto = require('crypto')
const jwt = require('jsonwebtoken')

const JWT_EXPIRY = '7d'
const OAUTH_NONCE_COOKIE = 'oauth_nonce'
const OAUTH_NONCE_MAX_AGE_MS = 10 * 60 * 1000

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

function createOAuthNonce() {
  return crypto.randomBytes(32).toString('hex')
}

function hashOAuthNonce(nonce) {
  return crypto.createHash('sha256').update(nonce).digest('hex')
}

function setOAuthNonceCookie(res, nonce) {
  res.cookie(OAUTH_NONCE_COOKIE, nonce, tokenCookieOptions(OAUTH_NONCE_MAX_AGE_MS))
}

function clearOAuthNonceCookie(res) {
  res.cookie(OAUTH_NONCE_COOKIE, '', tokenCookieOptions(0))
}

function signOAuthState(payload, expiresIn = '10m') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn })
}

function signOAuthLoginState(provider, nonce) {
  return signOAuthState({
    provider,
    mode: 'login',
    nonce_hash: hashOAuthNonce(nonce),
  })
}

function verifyOAuthState(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return null
  }
}

function hasValidOAuthNonce(req, statePayload) {
  const nonce = req.cookies?.[OAUTH_NONCE_COOKIE]
  if (!nonce || !statePayload?.nonce_hash) return false
  return hashOAuthNonce(nonce) === statePayload.nonce_hash
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
  createOAuthNonce,
  setOAuthNonceCookie,
  clearOAuthNonceCookie,
  signOAuthState,
  signOAuthLoginState,
  verifyOAuthState,
  hasValidOAuthNonce,
  signCompletionToken,
  verifyCompletionToken,
  JWT_EXPIRY,
  OAUTH_NONCE_COOKIE,
}
