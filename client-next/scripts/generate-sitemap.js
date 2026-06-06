// Sitemap generator for PostScholar
// Run manually after deployment to update sitemap.xml
// Usage: DATABASE_URL=your_railway_public_url node client-next/scripts/generate-sitemap.js

const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

async function generateSitemap() {
  const result = await pool.query(
    'SELECT id, created_at FROM discussions ORDER BY created_at DESC'
  )

  const urls = result.rows.map(row => `
  <url>
    <loc>https://postscholar.org/d/${row.id}</loc>
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
