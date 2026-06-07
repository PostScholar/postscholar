// Load environment variables from /server/.env before anything else
require('dotenv').config({ path: require('path').join(__dirname, '.env') })

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
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
app.use('/papers', require('./routes/papers'))           // DOI lookup, paper fetch
app.use('/auth', require('./routes/auth'))               // register, login, /me
app.use('/discussions', require('./routes/discussions')) // comments, search, delete
app.use('/auth/orcid', require('./routes/orcid'))         // ORCID OAuth integration // ORCID OAuth, author badge
app.use('/users', require('./routes/users'))             // user profiles
app.use('/search', require('./routes/search'))           // global search
app.use('/', exploreRouter) // explore feed and topics

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))

module.exports = app

