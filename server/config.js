// Only load .env file in non-Workers environment (local dev)
// In Cloudflare Workers, env vars are set via wrangler config/secrets
if (typeof __dirname !== 'undefined') {
  require('dotenv').config({ path: require('path').join(__dirname, '.env') })
}

const isProd = process.env.NODE_ENV === 'production'
const isTest = process.env.NODE_ENV === 'test'

function requireEnv(name) {
  const value = process.env[name]
  if (!value && !isTest) {
    console.error(`Missing required environment variable: ${name}`)
    process.exit(1)
  }
  return value
}

if (!isTest) {
  requireEnv('DATABASE_URL')
  requireEnv('JWT_SECRET')
  requireEnv('CLIENT_URL')

  // Validate OAuth provider configs (warn if incomplete)
  const hasGoogle = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  const hasGithub = process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET
  const hasOrcid = process.env.ORCID_CLIENT_ID && process.env.ORCID_CLIENT_SECRET

  if (!hasGoogle && !hasGithub && !hasOrcid) {
    console.warn('⚠️  No OAuth providers configured. Social sign-in will not work.')
  }
  if (process.env.GOOGLE_CLIENT_ID && !process.env.GOOGLE_CLIENT_SECRET) {
    console.error('❌ GOOGLE_CLIENT_ID set but GOOGLE_CLIENT_SECRET missing')
    process.exit(1)
  }
  if (process.env.GITHUB_CLIENT_ID && !process.env.GITHUB_CLIENT_SECRET) {
    console.error('❌ GITHUB_CLIENT_ID set but GITHUB_CLIENT_SECRET missing')
    process.exit(1)
  }
  if (process.env.ORCID_CLIENT_ID && !process.env.ORCID_CLIENT_SECRET) {
    console.error('❌ ORCID_CLIENT_ID set but ORCID_CLIENT_SECRET missing')
    process.exit(1)
  }
}

module.exports = {
  isProd,
  isTest,
  port: parseInt(process.env.PORT || '3000', 10),
  clientUrl: process.env.CLIENT_URL,
  rateLimits: {
    auth: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_AUTH_MAX || (isProd ? '10' : '50'), 10),
    },
    general: {
      windowMs: 15 * 60 * 1000,
      max: parseInt(process.env.RATE_LIMIT_GENERAL_MAX || (isProd ? '100' : '500'), 10),
    },
  },
  sentryDsn: process.env.SENTRY_DSN || null,
}
