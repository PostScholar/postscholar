jest.mock('../db', () => ({
  query: jest.fn(),
}))

const db = require('../db')
const { findOrCreateOAuthUser } = require('../routes/google')
const { linkOAuthProvider } = require('../lib/oauthUsers')

beforeEach(() => {
  db.query.mockReset()
})

describe('findOrCreateOAuthUser', () => {
  it('does not link a verified OAuth identity to an unverified local account', async () => {
    const email = 'unverified@example.com'
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-1',
          username: 'unverified',
          email,
          display_name: null,
          role: 'user',
          email_verified: false,
          google_id: null,
          github_id: null,
        }],
      })

    await expect(findOrCreateOAuthUser({
      provider: 'google',
      providerId: 'google-unverified',
      email,
      emailVerified: true,
      displayName: 'Verified Provider User',
      usernameBase: 'verified_provider_user',
    })).rejects.toMatchObject({
      statusCode: 409,
      code: 'OAUTH_EMAIL_REQUIRES_VERIFICATION',
    })

    expect(db.query).toHaveBeenCalledTimes(2)
  })

  it('links a verified OAuth identity to an existing verified local account', async () => {
    const email = 'verified@example.com'
    const providerId = 'google-verified'
    const existing = {
      id: 'user-2',
      username: 'verified',
      email,
      display_name: null,
      role: 'user',
      email_verified: true,
      google_id: null,
      github_id: null,
    }
    const updated = {
      ...existing,
      display_name: 'Verified Local User',
    }
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [existing] })
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [updated] })

    const user = await findOrCreateOAuthUser({
      provider: 'google',
      providerId,
      email,
      emailVerified: true,
      displayName: 'Verified Local User',
      usernameBase: 'verified_local_user',
    })

    expect(user).toBe(updated)
    expect(db.query).toHaveBeenCalledTimes(4)
    expect(db.query.mock.calls[2][1]).toEqual([
      providerId,
      true,
      'Verified Local User',
      existing.id,
    ])
  })

  it('does not link an unverified OAuth email to a verified local account', async () => {
    const email = 'provider-unverified@example.com'
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          id: 'user-3',
          username: 'provider_unverified',
          email,
          display_name: null,
          role: 'user',
          email_verified: true,
          google_id: null,
          github_id: null,
        }],
      })

    await expect(findOrCreateOAuthUser({
      provider: 'google',
      providerId: 'google-provider-unverified',
      email,
      emailVerified: false,
      displayName: 'Unverified Provider User',
      usernameBase: 'unverified_provider_user',
    })).rejects.toMatchObject({
      statusCode: 409,
      code: 'OAUTH_EMAIL_REQUIRES_VERIFICATION',
    })

    expect(db.query).toHaveBeenCalledTimes(2)
  })
})

describe('linkOAuthProvider', () => {
  it('only marks email verified when the provider email matches the account email', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ google_id: null, github_id: null }] })
      .mockResolvedValueOnce({ rows: [] })

    await linkOAuthProvider('user-4', 'google', 'google-provider-4', {
      email: 'provider@example.com',
      emailVerified: true,
      displayName: 'Provider User',
    })

    expect(db.query).toHaveBeenCalledTimes(3)
    const [sql, values] = db.query.mock.calls[2]
    expect(sql).toContain('email = COALESCE(email, $2)')
    expect(sql).toContain('email IS NULL OR lower(email) = lower($3)')
    expect(sql).toContain('WHERE id = $5')
    expect(values).toEqual([
      'google-provider-4',
      'provider@example.com',
      'provider@example.com',
      'Provider User',
      'user-4',
    ])
  })

  it('does not mark email verified when the provider email is unverified', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ google_id: null, github_id: null }] })
      .mockResolvedValueOnce({ rows: [] })

    await linkOAuthProvider('user-5', 'google', 'google-provider-5', {
      email: 'provider-unverified@example.com',
      emailVerified: false,
      displayName: 'Provider User',
    })

    expect(db.query).toHaveBeenCalledTimes(3)
    const [sql, values] = db.query.mock.calls[2]
    expect(sql).not.toContain('email_verified')
    expect(sql).toContain('WHERE id = $4')
    expect(values).toEqual([
      'google-provider-5',
      'provider-unverified@example.com',
      'Provider User',
      'user-5',
    ])
  })
})
