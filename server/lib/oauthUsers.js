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

function formatUserResponse(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name || null,
    role: user.role || 'user',
    email_verified: user.email_verified,
  }
}

function normalizeEmail(email) {
  return (email || '').trim().toLowerCase()
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
    `SELECT email, google_id, github_id FROM users WHERE id = $1`,
    [userId]
  )
  const user = current.rows[0]
  if (!user) {
    const err = new Error('User not found')
    err.code = 'USER_NOT_FOUND'
    throw err
  }
  if (user[idColumn]) {
    const err = new Error('Provider already linked to your account')
    err.code = 'ALREADY_LINKED'
    throw err
  }

  if (user.email) {
    const providerEmail = normalizeEmail(opts.email)
    const accountEmail = normalizeEmail(user.email)
    if (!opts.emailVerified || !providerEmail || providerEmail !== accountEmail) {
      const err = new Error('Provider email must be verified and match your PostScholar account email')
      err.code = 'PROVIDER_EMAIL_MISMATCH'
      throw err
    }
  } else if (opts.email && opts.emailVerified) {
    const emailTaken = await pool.query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND id != $2',
      [opts.email, userId]
    )
    if (emailTaken.rows.length > 0) {
      const err = new Error('This email is already used by another PostScholar account')
      err.code = 'EMAIL_TAKEN'
      throw err
    }
  }

  const updates = [`${idColumn} = $1`]
  const values = [providerId]
  let param = 2

  if (opts.email) {
    updates.push(`email = COALESCE(email, $${param++})`)
    values.push(opts.email)
  }
  if (opts.emailVerified) {
    updates.push(`email_verified = CASE WHEN $${param++} THEN true ELSE email_verified END`)
    values.push(true)
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
  formatUserResponse,
  linkOAuthProvider,
}
