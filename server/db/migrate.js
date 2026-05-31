const fs = require('fs')
const path = require('path')
const pool = require('./index')

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS migrations (
      id SERIAL PRIMARY KEY,
      filename TEXT UNIQUE NOT NULL,
      run_at TIMESTAMPTZ DEFAULT NOW()
    )
  `)

  const migrationsDir = path.join(__dirname, 'migrations')
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort()

  for (const file of files) {
    const already = await pool.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [file]
    )
    if (already.rows.length > 0) {
      console.log(`skipped: ${file}`)
      continue
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
    if (sql.trim()) await pool.query(sql)
    await pool.query(
      'INSERT INTO migrations (filename) VALUES ($1)',
      [file]
    )
    console.log(`ran: ${file}`)
  }

  await pool.end()
  console.log('migrations complete')
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})