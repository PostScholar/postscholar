const pool = require('../db')

async function verifyTestUserByEmail(email) {
  const result = await pool.query(
    'UPDATE users SET email_verified = true WHERE email = $1 RETURNING id',
    [email]
  )
  if (result.rowCount === 0) {
    throw new Error(`verifyTestUserByEmail: no user for ${email}`)
  }
}

module.exports = { verifyTestUserByEmail }
