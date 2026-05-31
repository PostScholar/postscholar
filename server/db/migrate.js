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

    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8')
      if (sql.trim()) await client.query(sql)
      await client.query(
        'INSERT INTO migrations (filename) VALUES ($1)',
        [file]
      )
      await client.query('COMMIT')
      console.log(`ran: ${file}`)
    } catch (err) {
      await client.query('ROLLBACK')
      throw err
    } finally {
      client.release()
    }
  }

  await pool.end()
  console.log('migrations complete')
}

migrate().catch(err => {
  console.error(err)
  process.exit(1)
})