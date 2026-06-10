require('dotenv').config({ path: require('path').join(__dirname, '.env') })

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
