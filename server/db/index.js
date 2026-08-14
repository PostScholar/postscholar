require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') })

const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
})

module.exports = pool
