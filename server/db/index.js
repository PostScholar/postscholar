// Conditional dotenv loading (only for local dev, not Workers)
if (typeof __dirname !== 'undefined') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
}

// Use Neon's serverless driver for Cloudflare Workers compatibility
// Falls back to regular pg for local development
let pool

if (process.env.NODE_ENV === 'production') {
  // Cloudflare Workers environment - use Neon serverless driver
  // For Workers, Neon automatically uses HTTP over fetch (not WebSockets)
  // Make sure DATABASE_URL uses the pooled endpoint (-pooler in hostname)
  const { Pool: NeonPool } = require('@neondatabase/serverless')

  pool = new NeonPool({
    connectionString: process.env.DATABASE_URL
  })
} else {
  // Local development - use standard pg driver
  const { Pool: PgPool } = require('pg')
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL
  })
}

module.exports = pool
