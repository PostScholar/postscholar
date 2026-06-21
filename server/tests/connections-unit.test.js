jest.mock('../db', () => ({
  query: jest.fn(),
  connect: jest.fn(),
}))

const pool = require('../db')
const { unlinkProvider } = require('../routes/connections')

beforeEach(() => {
  pool.query.mockReset()
  pool.connect.mockReset()
})

describe('unlinkProvider', () => {
  it('locks the user row before unlinking a sign-in method', async () => {
    const updated = {
      id: 'user-1',
      email: 'user@example.com',
      password_hash: 'hash',
      google_id: null,
      github_id: null,
      orcid_id: null,
      email_verified: true,
    }
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
        .mockResolvedValueOnce({
          rows: [{
            ...updated,
            google_id: 'google-1',
          }],
        })
        .mockResolvedValueOnce({ rows: [updated] })
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    }
    pool.connect.mockResolvedValueOnce(client)

    await expect(unlinkProvider('user-1', 'google')).resolves.toBe(updated)

    expect(pool.connect).toHaveBeenCalledTimes(1)
    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN')

    const [lockSql, lockParams] = client.query.mock.calls[1]
    expect(lockSql).toContain('SELECT id, email, password_hash, google_id, github_id, orcid_id, email_verified')
    expect(lockSql).toContain('FOR UPDATE')
    expect(lockParams).toEqual(['user-1'])

    const [updateSql, updateParams] = client.query.mock.calls[2]
    expect(updateSql).toContain('UPDATE users')
    expect(updateSql).toContain('SET google_id = NULL')
    expect(updateSql).toContain('RETURNING id, email, password_hash, google_id, github_id, orcid_id, email_verified')
    expect(updateParams).toEqual(['user-1'])

    expect(client.query).toHaveBeenNthCalledWith(4, 'COMMIT')
    expect(client.release).toHaveBeenCalledTimes(1)
  })

  it('returns null when the conditional unlink does not update a row', async () => {
    const client = {
      query: jest.fn()
        .mockResolvedValueOnce({})
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
        .mockResolvedValueOnce({}),
      release: jest.fn(),
    }
    pool.connect.mockResolvedValueOnce(client)

    await expect(unlinkProvider('user-1', 'password')).resolves.toBeNull()

    expect(client.query).toHaveBeenNthCalledWith(1, 'BEGIN')
    expect(client.query).toHaveBeenNthCalledWith(3, 'ROLLBACK')
    expect(client.release).toHaveBeenCalledTimes(1)
  })
})
