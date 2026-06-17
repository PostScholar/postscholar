const pool = require('../db')

const USERNAME_REGEX = /^[a-z0-9_]{3,30}$/

function sanitizeUsernameBase(value) {
  let base = (value || 'user')
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '')
  if (base.length < 3) base = `user_${base || 'x'}`
  return base.slice(0, 26)
}

async function findAvailableUsername(base) {
  const root = sanitizeUsernameBase(base)
  for (let i = 0; i < 100; i++) {
    const suffix = i === 0 ? '' : `_${i}`
    const candidate = `${root}${suffix}`.slice(0, 30)
    if (!USERNAME_REGEX.test(candidate)) continue
    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1',
      [candidate]
    )
    if (existing.rows.length === 0) return candidate
  }
  return `user_${Date.now().toString(36).slice(-8)}`
}

function needsEmailVerification(user) {
  if (user.google_id || user.github_id || user.orcid_id) return false
  return user.email_verified === false
}

function formatUserResponse(user) {
  const response = {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name || null,
    role: user.role || 'user',
    email_verified: user.email_verified,
    needs_email_verification: needsEmailVerification(user),
  }
  if (user.created_at != null) {
    response.created_at = user.created_at
  }
  return response
}

async function linkOAuthProvider(userId, provider, providerId, opts = {}) {
  const pool = require('../db')
  const idColumn = provider === 'google' ? 'google_id' : 'github_id'

  const taken = await pool.query(
    `SELECT id FROM users WHERE ${idColumn} = $1 AND id != $2`,
    [providerId, userId]
  )
  if (taken.rows.length > 0) {
    const err = new Error('This account is already linked to another PostScholar user')
    err.code = 'PROVIDER_TAKEN'
    throw err
  }

  const current = await pool.query(
    `SELECT google_id, github_id FROM users WHERE id = $1`,
    [userId]
  )
  if (current.rows[0]?.[idColumn]) {
    const err = new Error('Provider already linked to your account')
    err.code = 'ALREADY_LINKED'
    throw err
  }

  const updates = [`${idColumn} = $1`]
  const values = [providerId]
  let param = 2

  if (opts.email) {
    updates.push(`email = COALESCE(email, $${param++})`)
    values.push(opts.email)
  }
  if (opts.emailVerified && opts.email) {
    updates.push(
      `email_verified = CASE
         WHEN email IS NULL OR lower(email) = lower($${param++}) THEN true
         ELSE email_verified
       END`
    )
    values.push(opts.email)
  }
  if (opts.displayName) {
    updates.push(`display_name = COALESCE(display_name, $${param++})`)
    values.push(opts.displayName)
  }

  values.push(userId)
  await pool.query(
    `UPDATE users SET ${updates.join(', ')} WHERE id = $${param}`,
    values
  )
}

module.exports = {
  USERNAME_REGEX,
  sanitizeUsernameBase,
  findAvailableUsername,
  needsEmailVerification,
  formatUserResponse,
  linkOAuthProvider,
}
