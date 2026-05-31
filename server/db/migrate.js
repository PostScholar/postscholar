const fs = require('fs')
const path = require('path')
const pool = require('./index')

/**
 * migrate()
 *
 * Runs any SQL migration files in /server/db/migrations/ that haven't been
 * run yet. Migration state is tracked in a `migrations` table in the DB.
 *
 * Files are run in alphabetical order (001_, 002_, etc.) so naming matters.
 * Each migration runs inside a transaction — if the SQL fails, the migration
 * is rolled back and NOT recorded as complete, so it will be retried next run.
 *
 * This is called manually with `node server/db/migrate.js` both locally and
 * against Railway (using DATABASE_URL=<railway_url> node server/db/migrate.js).
 */
async function migrate() {
  // Ensure the migrations tracking table exists before we do anything else
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
    .sort() // alphabetical = chronological given our 001_, 002_ naming

  for (const file of files) {
    // Skip files already recorded in the migrations table
    const already = await pool.query(
      'SELECT id FROM migrations WHERE filename = $1',
      [file]
    )
    if (already.rows.length > 0) {
      console.log(`skipped: ${file}`)
      continue
    }

    // Run the migration inside a transaction so that if the SQL fails,
    // the migration row is NOT inserted and the error surfaces clearly
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
