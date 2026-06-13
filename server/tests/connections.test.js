const request = require('supertest')
const app = require('../index')
const pool = require('../db')

const ts = Date.now()
const testEmail = `conn_${ts}@example.com`
const testUsername = `conn_${ts}`
const testPassword = 'password123'

let cookie = ''
let userId = ''

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
    await pool.query('DELETE FROM users WHERE username = $1', [testUsername])
  } catch (_err) {
    // cleanup best-effort
  }
})

describe('Linked accounts', () => {
  beforeAll(async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword })

    expect(res.status).toBe(201)
    cookie = res.headers['set-cookie'][0]

    const me = await request(app).get('/auth/me').set('Cookie', cookie)
    userId = me.body.id
  })

  it('returns sign-in methods for the current user', async () => {
    const res = await request(app)
      .get('/users/me/connections')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.sign_in_method_count).toBe(1)
    expect(res.body.email).toBe(testEmail)

    const password = res.body.connections.find(c => c.provider === 'password')
    expect(password.linked).toBe(true)
    expect(password.can_unlink).toBe(false)
    expect(password.detail).toBe(testEmail)

    const google = res.body.connections.find(c => c.provider === 'google')
    expect(google.linked).toBe(false)
    expect(google.can_link).toBe(true)
  })

  it('blocks unlinking the only sign-in method', async () => {
    const res = await request(app)
      .delete('/users/me/connections/password')
      .set('Cookie', cookie)

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('LAST_SIGN_IN_METHOD')
  })

  it('allows unlinking password when another method exists', async () => {
    await pool.query(
      'UPDATE users SET google_id = $1 WHERE id = $2',
      [`google_${ts}`, userId]
    )

    const res = await request(app)
      .delete('/users/me/connections/password')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.sign_in_method_count).toBe(1)

    const password = res.body.connections.find(c => c.provider === 'password')
    expect(password.linked).toBe(false)

    const google = res.body.connections.find(c => c.provider === 'google')
    expect(google.linked).toBe(true)
    expect(google.can_unlink).toBe(false)
  })

  it('keeps one sign-in method when unlink requests race', async () => {
    const raceEmail = `race_${ts}@example.com`
    const raceUsername = `race_${ts}`
    let raceUserId = null

    try {
      const register = await request(app)
        .post('/auth/register')
        .send({ email: raceEmail, username: raceUsername, password: testPassword })

      expect(register.status).toBe(201)
      const raceCookie = register.headers['set-cookie'][0]

      const me = await request(app).get('/auth/me').set('Cookie', raceCookie)
      raceUserId = me.body.id

      await pool.query(
        'UPDATE users SET google_id = $1 WHERE id = $2',
        [`google_race_${ts}`, raceUserId]
      )

      const [passwordRes, googleRes] = await Promise.all([
        request(app)
          .delete('/users/me/connections/password')
          .set('Cookie', raceCookie),
        request(app)
          .delete('/users/me/connections/google')
          .set('Cookie', raceCookie),
      ])

      expect([passwordRes.status, googleRes.status].sort()).toEqual([200, 400])

      const finalState = await request(app)
        .get('/users/me/connections')
        .set('Cookie', raceCookie)

      expect(finalState.status).toBe(200)
      expect(finalState.body.sign_in_method_count).toBe(1)
      expect(finalState.body.connections.filter(c => c.linked)).toHaveLength(1)
    } finally {
      if (raceUserId) {
        await pool.query('DELETE FROM users WHERE id = $1', [raceUserId])
      } else {
        await pool.query('DELETE FROM users WHERE email = $1', [raceEmail])
      }
    }
  })

  it('sets a password for OAuth-only users with email', async () => {
    const oauthEmail = `oauth_${ts}@example.com`
    const oauthUser = `oauth_${ts}`

    const inserted = await pool.query(
      `INSERT INTO users (username, email, google_id, email_verified)
       VALUES ($1, $2, $3, true)
       RETURNING id`,
      [oauthUser, oauthEmail, `google_oauth_${ts}`]
    )
    const oauthUserId = inserted.rows[0].id

    const token = require('../lib/session').signToken({
      userId: oauthUserId,
      username: oauthUser,
    })
    const oauthCookie = `token=${token}; Path=/`

    const setRes = await request(app)
      .post('/users/me/connections/password')
      .set('Cookie', oauthCookie)
      .send({ password: 'newpass123' })

    expect(setRes.status).toBe(200)

    const password = setRes.body.connections.find(c => c.provider === 'password')
    expect(password.linked).toBe(true)
    expect(setRes.body.sign_in_method_count).toBe(2)

    await pool.query('DELETE FROM users WHERE id = $1', [oauthUserId])
  })

  it('rejects password shorter than 8 characters', async () => {
    const res = await request(app)
      .post('/users/me/connections/password')
      .set('Cookie', cookie)
      .send({ password: 'short' })

    expect(res.status).toBe(400)
  })
})

describe('OAuth link URL endpoints', () => {
  it('requires auth for Google link URL', async () => {
    const res = await request(app).get('/auth/google/link/url')
    expect(res.status).toBe(401)
  })

  it('returns link URL when authenticated and Google is configured', async () => {
    if (!process.env.GOOGLE_CLIENT_ID) {
      return
    }

    const res = await request(app)
      .get('/auth/google/link/url')
      .set('Cookie', cookie)

    expect(res.status).toBe(200)
    expect(res.body.url).toContain('accounts.google.com')
  })
})
