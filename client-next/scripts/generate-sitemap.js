// Legacy sitemap generator — prefer client-next/src/app/sitemap.js (dynamic).
// This script remains for one-off exports if the API is unavailable.
// Usage: DATABASE_URL=your_railway_public_url node client-next/scripts/generate-sitemap.js

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function generateSitemap() {
  const result = await pool.query(
    `SELECT d.id, d.created_at, p.title
     FROM discussions d
     JOIN papers p ON p.id = d.paper_id
     ORDER BY d.created_at DESC`
  )

  function slugify(title, id) {
    const slug = (title || 'discussion')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
    return `${slug || 'discussion'}-${id}`
  }

  const urls = result.rows.map(row => `
  <url>
    <loc>https://postscholar.org/d/${slugify(row.title, row.id)}</loc>
    <lastmod>${new Date(row.created_at).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`).join('')

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://postscholar.org</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>${urls}
</urlset>`

  const outputPath = path.join(__dirname, '../public/sitemap.xml')
  fs.writeFileSync(outputPath, sitemap)
  console.log(`sitemap.xml written with ${result.rows.length} discussions`)
  await pool.end()
}

generateSitemap().catch(console.error)
