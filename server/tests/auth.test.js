const request = require('supertest')
const app = require('../index')
const pool = require('../db')

const testEmail = `test_${Date.now()}@example.com`
const testUsername = `testuser_${Date.now()}`
const testPassword = 'password123'

let cookie = ''

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
  } catch (_err) {
    // cleanup best-effort
  }
})

describe('POST /auth/register', () => {
  it('creates a new user and sets a cookie', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword })

    expect(res.status).toBe(201)
    expect(res.body.username).toBe(testUsername)
    expect(res.body.email_verified).toBe(false)
    expect(res.headers['set-cookie']).toBeDefined()
    cookie = res.headers['set-cookie'][0]
  })

  it('rejects duplicate email', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, username: 'another', password: testPassword })

    expect(res.status).toBe(409)
  })
})

describe('POST /auth/login', () => {
  it('logs in with correct credentials', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: testPassword })

    expect(res.status).toBe(200)
    expect(res.body.username).toBe(testUsername)
    cookie = res.headers['set-cookie'][0]
  })

  it('rejects wrong password', async () => {
    const res = await request(app)
      .post('/auth/login')
      .send({ email: testEmail, password: 'wrongpassword' })

    expect(res.status).toBe(401)
  })
})

describe('GET /auth/me', () => {
  it('returns current user when authenticated', async () => {
    const res = await request(app)
      .get('/auth/me')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.username).toBe(testUsername)
  })

  it('returns 401 when not authenticated', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })
})
