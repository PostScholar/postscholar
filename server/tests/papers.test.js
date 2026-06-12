const request = require('supertest')
const app = require('../index')
const pool = require('../db')
const { verifyTestUserByEmail } = require('./helpers')

const ts = Date.now().toString(36)
const testEmail = `papertest_${ts}@example.com`
const testUsername = `pt_${ts}`
let cookie = ''
let discussionId = ''

const describeNetwork = process.env.CI ? describe : describe.skip

beforeAll(async () => {
  const res = await request(app)
    .post('/auth/register')
    .send({ email: testEmail, username: testUsername, password: 'password123' })
  cookie = res.headers['set-cookie'][0]
  await verifyTestUserByEmail(testEmail)
})

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
  } catch (_err) {
    // cleanup best-effort
  }
})

describeNetwork('POST /papers/lookup (requires network)', () => {
  it('looks up a real DOI from CrossRef', async () => {
    const res = await request(app)
      .post('/papers/lookup')
      .set('Cookie', cookie)
      .send({ doi: '10.1038/nature14539' })

    // 201 when newly stored from CrossRef; 200 when paper already in DB
    expect([200, 201]).toContain(res.status)
    expect(res.body.found).toBe(true)
    expect(res.body.paper.title).toBeDefined()
  }, 15000)

  it('returns found: false for invalid DOI', async () => {
    const res = await request(app)
      .post('/papers/lookup')
      .set('Cookie', cookie)
      .send({ doi: '10.9999/doesnotexist99999' })

    expect(res.status).toBe(200)
    expect(res.body.found).toBe(false)
  }, 15000)
})

describe('POST /discussions', () => {
  it('creates a discussion for a manual paper', async () => {
    const paperRes = await request(app)
      .post('/papers/manual')
      .set('Cookie', cookie)
      .send({ title: `Paper test ${ts}`, authors: 'Jane Doe', year: 2024 })

    expect(paperRes.status).toBe(201)
    const paperId = paperRes.body.paper.id

    const res = await request(app)
      .post('/discussions')
      .set('Cookie', cookie)
      .send({ paper_id: paperId, topics: [], custom_tags: [] })

    if (res.body.existed) {
      discussionId = res.body.discussion_id
    } else {
      expect(res.status).toBe(201)
      discussionId = res.body.discussion_id
    }

    expect(discussionId).toBeDefined()
  })
})

describe('POST /discussions/:id/comments', () => {
  it('posts a comment on a discussion', async () => {
    if (!discussionId) return

    const res = await request(app)
      .post(`/discussions/${discussionId}/comments`)
      .set('Cookie', cookie)
      .send({ body: 'Automated integration test comment.' })

    expect(res.status).toBe(201)
    expect(res.body.comment.body).toBe('Automated integration test comment.')
  })
})
