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

module.exports = {
  USERNAME_REGEX,
  sanitizeUsernameBase,
  findAvailableUsername,
  formatUserResponse,
}
