const request = require('supertest')
const app = require('../index')
const pool = require('../db')

const ts = Date.now().toString(36)
const userA = { email: `social_a_${ts}@example.com`, username: `sa_${ts}` }
const userB = { email: `social_b_${ts}@example.com`, username: `sb_${ts}` }
const password = 'password123'

let cookieA = ''
let cookieB = ''
let discussionId = ''
let commentId = ''

beforeAll(async () => {
  const regA = await request(app)
    .post('/auth/register')
    .send({ ...userA, password })
  cookieA = regA.headers['set-cookie'][0]

  const regB = await request(app)
    .post('/auth/register')
    .send({ ...userB, password })
  cookieB = regB.headers['set-cookie'][0]

  await pool.query(
    "UPDATE users SET role = 'moderator' WHERE username = $1",
    [userA.username]
  )

  const paperRes = await request(app)
    .post('/papers/manual')
    .set('Cookie', cookieA)
    .send({
      title: `Social test paper ${ts}`,
      authors: 'Jane Doe',
      year: 2024,
    })

  expect(paperRes.status).toBe(201)
  const paperId = paperRes.body.paper.id

  const discRes = await request(app)
    .post('/discussions')
    .set('Cookie', cookieA)
    .send({ paper_id: paperId, topics: [], custom_tags: [] })

  expect([200, 201]).toContain(discRes.status)
  discussionId = discRes.body.discussion_id
  expect(discussionId).toBeDefined()

  const commentRes = await request(app)
    .post(`/discussions/${discussionId}/comments`)
    .set('Cookie', cookieB)
    .send({ body: `Hello @${userA.username} from test` })

  expect(commentRes.status).toBe(201)
  commentId = commentRes.body.comment.id
})

afterAll(async () => {
  try {
    await pool.query('DELETE FROM users WHERE email = ANY($1::text[])', [
      [userA.email, userB.email],
    ])
  } catch (_err) {
    // cleanup best-effort
  }
})

describe('POST /follows/:username', () => {
  it('follows another user', async () => {
    const res = await request(app)
      .post(`/follows/${userB.username}`)
      .set('Cookie', cookieA)

    expect(res.status).toBe(200)
    expect(res.body.following).toBe(true)
  })

  it('returns follow status', async () => {
    const res = await request(app)
      .get(`/follows/${userB.username}/status`)
      .set('Cookie', cookieA)

    expect(res.status).toBe(200)
    expect(res.body.following).toBe(true)
  })
})

describe('GET /mentions', () => {
  it('returns mentions for mentioned user', async () => {
    const res = await request(app)
      .get('/mentions')
      .set('Cookie', cookieA)

    expect(res.status).toBe(200)
    expect(res.body.mentions.length).toBeGreaterThan(0)
    expect(res.body.mentions[0].mentioning_username).toBe(userB.username)
    expect(res.body.mentions[0].type).toBe('mention')
  })

  it('notifies comment author when appreciated', async () => {
    const reactRes = await request(app)
      .post(`/discussions/comments/${commentId}/react`)
      .set('Cookie', cookieA)

    expect(reactRes.status).toBe(200)
    expect(reactRes.body.reacted).toBe(true)

    const res = await request(app)
      .get('/mentions')
      .set('Cookie', cookieB)

    expect(res.status).toBe(200)
    const appreciation = res.body.mentions.find(m => m.type === 'appreciation')
    expect(appreciation).toBeDefined()
    expect(appreciation.mentioning_username).toBe(userA.username)
  })
})

describe('POST /reports', () => {
  it('submits a report', async () => {
    const res = await request(app)
      .post('/reports')
      .set('Cookie', cookieA)
      .send({
        comment_id: commentId,
        discussion_id: discussionId,
        reason: 'spam',
        description: 'test report',
      })

    expect(res.status).toBe(201)
    expect(res.body.reported).toBe(true)
  })

  it('lists reports for moderator', async () => {
    const res = await request(app)
      .get('/reports?status=pending')
      .set('Cookie', cookieA)

    expect(res.status).toBe(200)
    expect(res.body.reports.length).toBeGreaterThan(0)
  })

  it('rejects non-moderator from listing reports', async () => {
    const res = await request(app)
      .get('/reports?status=pending')
      .set('Cookie', cookieB)

    expect(res.status).toBe(403)
  })
})
