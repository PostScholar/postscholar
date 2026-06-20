jest.mock('../db', () => ({
  query: jest.fn(),
}))

const pool = require('../db')
const { unlinkProvider } = require('../routes/connections')

beforeEach(() => {
  pool.query.mockReset()
})

describe('unlinkProvider', () => {
  it('unlinks with an atomic last-sign-in-method guard', async () => {
    const updated = {
      id: 'user-1',
      email: 'user@example.com',
      password_hash: 'hash',
      google_id: null,
      github_id: null,
      orcid_id: null,
      email_verified: true,
    }
    pool.query.mockResolvedValueOnce({ rows: [updated] })

    await expect(unlinkProvider('user-1', 'google')).resolves.toBe(updated)

    expect(pool.query).toHaveBeenCalledTimes(1)
    const [sql, params] = pool.query.mock.calls[0]
    expect(sql).toContain('UPDATE users')
    expect(sql).toContain('SET google_id = NULL')
    expect(sql).toContain('AND google_id IS NOT NULL')
    expect(sql).toContain('CASE WHEN password_hash IS NOT NULL THEN 1 ELSE 0 END')
    expect(sql).toContain('CASE WHEN google_id IS NOT NULL THEN 1 ELSE 0 END')
    expect(sql).toContain(') > 1')
    expect(sql).toContain('RETURNING id, email, password_hash, google_id, github_id, orcid_id, email_verified')
    expect(params).toEqual(['user-1'])
  })

  it('returns null when the conditional unlink does not update a row', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] })

    await expect(unlinkProvider('user-1', 'password')).resolves.toBeNull()

    const [sql] = pool.query.mock.calls[0]
    expect(sql).toContain('SET password_hash = NULL')
  })
})
