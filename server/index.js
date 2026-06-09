// Load environment variables from /server/.env before anything else
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const rateLimit = require('express-rate-limit')
const exploreRouter = require('./routes/explore')
const app = express()

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
// credentials: true is required for the browser to send httpOnly cookies
// cross-origin (frontend on Vercel, backend on Railway).
// All allowed origins are listed explicitly — wildcard (*) cannot be used
// with credentials: true.
// ---------------------------------------------------------------------------
app.use(cors({
  origin: [
    process.env.CLIENT_URL,               // https://postscholar.org (from env)
    'https://www.postscholar.org',
    'https://postscholar.vercel.app',     // Vercel preview deployments
    'http://localhost:3001'               // Next.js development server
  ],
  credentials: true
}))

// Parse incoming JSON request bodies
app.use(express.json())

// Parse cookies — required to read the httpOnly JWT token cookie
app.use(cookieParser())

// ---------------------------------------------------------------------------
// Rate Limiting
// ---------------------------------------------------------------------------
// Protect against abuse and DoS attacks by limiting request rates.
// Auth routes: 10 attempts per 15 minutes (login/register/password reset)
// General routes: 100 requests per 15 minutes
// ---------------------------------------------------------------------------

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  skipSuccessfulRequests: true, // Don't count successful auth attempts
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' }
})

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
})

const db = require('./db')

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
// Used by Railway and uptime monitors to confirm the server and DB are up.
// Returns { status: 'ok' } if the DB connection is healthy.
// ---------------------------------------------------------------------------
app.get('/health', async (req, res) => {
  await db.query('SELECT 1')
  res.json({ status: 'ok' })
})

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
// Apply auth rate limiter to sensitive auth endpoints
app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)
app.use('/auth/forgot-password', authLimiter)
app.use('/auth/reset-password', authLimiter)

// Apply general rate limiter to all routes
app.use('/', generalLimiter)

// Register all route handlers
app.use('/papers', require('./routes/papers'))           // DOI lookup, paper fetch
app.use('/auth', require('./routes/auth'))               // register, login, /me
app.use('/discussions', require('./routes/discussions')) // comments, search, delete
app.use('/auth/orcid', require('./routes/orcid'))         // ORCID OAuth integration // ORCID OAuth, author badge
app.use('/users', require('./routes/users'))             // user profiles
app.use('/search', require('./routes/search'))           // global search
app.use('/bookmarks', require('./routes/bookmarks'))     // bookmark discussions
app.use('/reports', require('./routes/reports'))         // moderation reports
app.use('/follows', require('./routes/follows'))         // following system
app.use('/', exploreRouter) // explore feed and topics

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))

module.exports = app

