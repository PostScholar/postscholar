jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
  end: jest.fn(),
}))

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret'

const request = require('supertest')
const app = require('../index')
const pool = require('../db')
const { signToken } = require('../lib/session')

function mockClient() {
  return {
    query: jest.fn(),
    release: jest.fn(),
  }
}

describe('DELETE /users/me/connections/:provider transaction guard', () => {
  beforeEach(() => {
    pool.query.mockReset()
    pool.connect.mockReset()
  })

  it('rechecks unlink eligibility while holding a row lock', async () => {
    const client = mockClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'user@example.com',
          password_hash: 'hash',
          google_id: null,
          github_id: null,
          orcid_id: null,
          email_verified: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] }) // ROLLBACK

    const token = signToken({ userId: 'user-1', username: 'user' })
    const res = await request(app)
      .delete('/users/me/connections/password')
      .set('Cookie', `token=${token}`)

    expect(res.status).toBe(400)
    expect(res.body.code).toBe('LAST_SIGN_IN_METHOD')
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('FOR UPDATE'),
      ['user-1']
    )
    expect(client.query).not.toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET password_hash = NULL'),
      expect.any(Array)
    )
    expect(client.query).toHaveBeenCalledWith('ROLLBACK')
    expect(client.release).toHaveBeenCalled()
  })

  it('commits after unlinking when another sign-in method remains', async () => {
    const client = mockClient()
    pool.connect.mockResolvedValue(client)
    client.query
      .mockResolvedValueOnce({ rows: [] }) // BEGIN
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'user@example.com',
          password_hash: 'hash',
          google_id: 'google-1',
          github_id: null,
          orcid_id: null,
          email_verified: true,
        }],
      })
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          email: 'user@example.com',
          password_hash: null,
          google_id: 'google-1',
          github_id: null,
          orcid_id: null,
          email_verified: true,
        }],
      })
      .mockResolvedValueOnce({ rows: [] }) // COMMIT

    const token = signToken({ userId: 'user-1', username: 'user' })
    const res = await request(app)
      .delete('/users/me/connections/password')
      .set('Cookie', `token=${token}`)

    expect(res.status).toBe(200)
    expect(res.body.sign_in_method_count).toBe(1)
    expect(res.body.connections.find(c => c.provider === 'password').linked).toBe(false)
    expect(client.query).toHaveBeenCalledWith(
      expect.stringContaining('UPDATE users SET password_hash = NULL'),
      ['user-1']
    )
    expect(client.query).toHaveBeenCalledWith('COMMIT')
    expect(client.release).toHaveBeenCalled()
  })
})
