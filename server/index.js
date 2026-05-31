require('dotenv').config({ path: require('path').join(__dirname, '.env') })
const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')

const app = express()

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(express.json())
app.use(cookieParser())

const db = require('./db')

app.get('/health', async (req, res) => {
  await db.query('SELECT 1')
  res.json({ status: 'ok' })
})

app.use('/auth', require('./routes/auth'))

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))