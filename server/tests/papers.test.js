const request = require('supertest')
const app = require('../index')
const pool = require('../db')

const testEmail = `papertest_${Date.now()}@example.com`
const testUsername = `papertest_${Date.now()}`
let cookie = ''
let discussionId = ''

beforeAll(async () => {
  const res = await request(app)
    .post('/auth/register')
    .send({ email: testEmail, username: testUsername, password: 'password123' })
  cookie = res.headers['set-cookie'][0]
})

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = $1', [testEmail])
  } catch (err) {
  }
})

describe('POST /papers/lookup', () => {
  it('looks up a real DOI from CrossRef', async () => {
    const res = await request(app)
      .post('/papers/lookup')
      .set('Cookie', cookie)
      .send({ doi: '10.1038/nature14539' })

    expect(res.status).toBe(200)
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
  it('creates a discussion for a looked-up paper', async () => {
    const lookupRes = await request(app)
      .post('/papers/lookup')
      .set('Cookie', cookie)
      .send({ doi: '10.1038/nature14539' })

    const paperId = lookupRes.body.paper.id

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
  }, 15000)
})

describe('POST /discussions/:id/comments', () => {
  it('posts a comment on a discussion', async () => {
    if (!discussionId) return

    const res = await request(app)
      .post(`/discussions/${discussionId}/comments`)
      .set('Cookie', cookie)
      .send({ body: 'This is a test comment from automated tests.' })

    expect(res.status).toBe(201)
    expect(res.body.comment.body).toBe('This is a test comment from automated tests.')
  })
})
