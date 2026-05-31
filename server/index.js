require('dotenv').config()
const express = require('express')
const cors = require('cors')

const app = express()

app.use(cors({ origin: process.env.CLIENT_URL }))
app.use(express.json())

const db = require('./db')

app.get('/health', async (req, res) => {
  await db.query('SELECT 1')
  res.json({ status: 'ok' })
})

const PORT = process.env.PORT || 3000
app.listen(PORT, () => console.log(`server running on port ${PORT}`))