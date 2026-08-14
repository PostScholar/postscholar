// Conditional dotenv loading (only for local dev, not Workers)
if (typeof __dirname !== 'undefined') {
  require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })
}

// Use Neon's serverless driver for Cloudflare Workers compatibility
// Falls back to regular pg for local development
let pool

if (process.env.NODE_ENV === 'production') {
  // Cloudflare Workers environment - use Neon HTTP SQL
  // Create a NEW sql function for EACH query to avoid cross-request I/O issues
  const { neon } = require('@neondatabase/serverless')

  // Wrap in pool-like interface for compatibility with existing code
  pool = {
    query: async (text, params) => {
      // Create a fresh sql function for THIS request only
      const sql = neon(process.env.DATABASE_URL)
      // neon() returns an array of rows directly
      const rows = await sql(text, params || [])
      return { rows }
    },

    // Transaction wrapper for Neon serverless (no persistent client)
    // Executes callback with a transaction-like interface
    connect: async () => {
      const sql = neon(process.env.DATABASE_URL)

      return {
        query: async (text, params) => {
          const rows = await sql(text, params || [])
          return { rows }
        },
        release: () => {},
      }
    }
  }
} else {
  // Local development - use standard pg driver with pooling
  const { Pool: PgPool } = require('pg')
  pool = new PgPool({
    connectionString: process.env.DATABASE_URL
  })
}

module.exports = pool
