const config = require('./config')

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const exploreRouter = require('./routes/explore')
const errorHandler = require('./middleware/errorHandler')
const app = express()

const corsOrigins = [
  config.clientUrl,
  'https://www.postscholar.org',
  'https://postscholar.vercel.app',
  'http://localhost:3001',
  'http://127.0.0.1:3001',
].filter(Boolean)

app.use(helmet())
app.use(cors({
  origin: corsOrigins,
  credentials: true,
}))

app.use(express.json())
app.use(cookieParser())

const authLimiter = rateLimit({
  windowMs: config.rateLimits.auth.windowMs,
  max: config.rateLimits.auth.max,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts, please try again later.' },
})

const generalLimiter = rateLimit({
  windowMs: config.rateLimits.general.windowMs,
  max: config.rateLimits.general.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
})

const db = require('./db')

app.get('/health', async (req, res) => {
  await db.query('SELECT 1')
  res.json({ status: 'ok' })
})

app.use('/auth/login', authLimiter)
app.use('/auth/register', authLimiter)
app.use('/auth/forgot-password', authLimiter)
app.use('/auth/reset-password', authLimiter)
app.use('/', generalLimiter)

app.use('/papers', require('./routes/papers'))
app.use('/auth', require('./routes/auth'))
app.use('/discussions', require('./routes/discussions'))
app.use('/auth/orcid', require('./routes/orcid'))
app.use('/users', require('./routes/users'))
app.use('/search', require('./routes/search'))
app.use('/bookmarks', require('./routes/bookmarks'))
app.use('/reports', require('./routes/reports'))
app.use('/follows', require('./routes/follows'))
app.use('/mentions', require('./routes/mentions'))
app.use('/topic-follows', require('./routes/topic-follows'))
app.use('/', exploreRouter)

app.use(errorHandler)

if (require.main === module) {
  app.listen(config.port, () => console.log(`server running on port ${config.port}`))
}

module.exports = app
