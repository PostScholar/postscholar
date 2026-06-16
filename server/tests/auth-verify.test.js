const request = require('supertest')
const crypto = require('crypto')
const app = require('../index')
const pool = require('../db')
const { signCompletionToken } = require('../lib/session')

const ts = Date.now()
const testEmail = `verify_${ts}@example.com`
const testUsername = `verify_${ts}`
const testPassword = 'password123'

let cookie = ''
let userId = ''
let paperId = ''
let discussionId = ''

function hashToken(raw) {
  return crypto.createHash('sha256').update(raw).digest('hex')
}

afterAll(async () => {
  try {
    if (discussionId) {
      await pool.query('DELETE FROM discussions WHERE id = $1', [discussionId])
    }
    if (paperId) {
      await pool.query('DELETE FROM papers WHERE id = $1', [paperId])
    }
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
  } catch (_err) {
    // cleanup best-effort
  }
})

describe('Email verification flow', () => {
  it('registers with email_verified false', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: testEmail, username: testUsername, password: testPassword })

    expect(res.status).toBe(201)
    expect(res.body.email_verified).toBe(false)
    expect(res.body.needs_email_verification).toBe(true)
    cookie = res.headers['set-cookie'][0]

    const me = await request(app).get('/auth/me').set('Cookie', cookie)
    userId = me.body.id
    expect(me.body.email_verified).toBe(false)
    expect(me.body.needs_email_verification).toBe(true)
  })

  it('blocks unverified user from posting comments', async () => {
    const paper = await pool.query(
      `INSERT INTO papers (doi, title, authors_json, journal, year, source)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [`10.9999/verify.${ts}`, 'Verify Test Paper', '[]', 'Test Journal', 2024, 'manual']
    )
    paperId = paper.rows[0].id

    const discussion = await pool.query(
      `INSERT INTO discussions (paper_id, created_by) VALUES ($1, $2) RETURNING id`,
      [paperId, userId]
    )
    discussionId = discussion.rows[0].id

    const res = await request(app)
      .post(`/discussions/${discussionId}/comments`)
      .set('Cookie', cookie)
      .send({ body: 'Should be blocked' })

    expect(res.status).toBe(403)
    expect(res.body.code).toBe('EMAIL_UNVERIFIED')
  })

  it('resend invalidates previous verification link', async () => {
    const oldToken = crypto.randomBytes(32).toString('hex')
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, hashToken(oldToken)]
    )

    const resend = await request(app)
      .post('/auth/resend-verification')
      .set('Cookie', cookie)
    expect(resend.status).toBe(200)

    const oldLink = await request(app).get(`/auth/verify-email?token=${oldToken}`)
    expect(oldLink.status).toBe(400)
    expect(oldLink.body.error).toBe('Invalid or expired verification token')
  })

  it('allows posting after email verification', async () => {
    const rawToken = crypto.randomBytes(32).toString('hex')
    await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour')`,
      [userId, hashToken(rawToken)]
    )

    const verify = await request(app).get(`/auth/verify-email?token=${rawToken}`)
    expect(verify.status).toBe(200)

    const res = await request(app)
      .post(`/discussions/${discussionId}/comments`)
      .set('Cookie', cookie)
      .send({ body: 'Verified comment' })

    expect(res.status).toBe(201)
    expect(res.body.comment.body).toBe('Verified comment')
  })

  it('returns success when verifying with already-used token on verified user', async () => {
    const usedToken = crypto.randomBytes(32).toString('hex')
    const insert = await pool.query(
      `INSERT INTO email_verification_tokens (user_id, token_hash, expires_at, used_at)
       VALUES ($1, $2, NOW() + INTERVAL '1 hour', NOW())
       RETURNING id`,
      [userId, hashToken(usedToken)]
    )

    const res = await request(app).get(`/auth/verify-email?token=${usedToken}`)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Email already verified')

    await pool.query('DELETE FROM email_verification_tokens WHERE id = $1', [insert.rows[0].id])
  })

  it('resend after verify returns already verified', async () => {
    const res = await request(app)
      .post('/auth/resend-verification')
      .set('Cookie', cookie)
    expect(res.status).toBe(200)
    expect(res.body.message).toBe('Email already verified')

    const me = await request(app).get('/auth/me').set('Cookie', cookie)
    expect(me.body.needs_email_verification).toBe(false)
  })
})

describe('ORCID account completion', () => {
  it('creates user from completion token', async () => {
    const orcidId = `0000-0002-${ts.toString().slice(-4)}-${(ts % 10000).toString().padStart(4, '0')}`
    const token = signCompletionToken({
      mode: 'orcid_complete',
      orcid_id: orcidId,
      display_name: 'Test Researcher',
      email: null,
    })

    const username = `orcid_${ts}`
    const res = await request(app)
      .post('/auth/complete')
      .send({ token, username, display_name: 'Test Researcher' })

    expect(res.status).toBe(201)
    expect(res.body.username).toBe(username)
    expect(res.body.display_name).toBe('Test Researcher')

    await pool.query('DELETE FROM users WHERE username = $1', [username])
  })
})

describe('OAuth URL endpoints', () => {
  it('returns 503 when Google is not configured', async () => {
    const prev = process.env.GOOGLE_CLIENT_ID
    delete process.env.GOOGLE_CLIENT_ID
    const res = await request(app).get('/auth/google/url')
    expect(res.status).toBe(503)
    process.env.GOOGLE_CLIENT_ID = prev
  })

  it('returns 503 when GitHub is not configured', async () => {
    const prev = process.env.GITHUB_CLIENT_ID
    delete process.env.GITHUB_CLIENT_ID
    const res = await request(app).get('/auth/github/url')
    expect(res.status).toBe(503)
    process.env.GITHUB_CLIENT_ID = prev
  })
})
