const pool = require('../db')

afterAll(async () => {
  setTimeout(() => pool.end(), 500)
})
