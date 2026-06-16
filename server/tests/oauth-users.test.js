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
  it('rejects linking a provider with a different verified email', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          email: 'victim@example.com',
          google_id: null,
          github_id: null,
        }],
      })

    await expect(linkOAuthProvider('user-1', 'google', 'google-attacker', {
      email: 'attacker@example.com',
      emailVerified: true,
      displayName: 'Attacker',
    })).rejects.toMatchObject({
      code: 'PROVIDER_EMAIL_MISMATCH',
    })

    expect(db.query).toHaveBeenCalledTimes(2)
  })

  it('rejects linking a provider when the matching email is not verified by the provider', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          email: 'victim@example.com',
          google_id: null,
          github_id: null,
        }],
      })

    await expect(linkOAuthProvider('user-1', 'google', 'google-unverified', {
      email: 'victim@example.com',
      emailVerified: false,
      displayName: 'Victim',
    })).rejects.toMatchObject({
      code: 'PROVIDER_EMAIL_MISMATCH',
    })

    expect(db.query).toHaveBeenCalledTimes(2)
  })

  it('links a provider when the verified provider email matches the account email', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          email: 'Victim@Example.com',
          google_id: null,
          github_id: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [] })

    await linkOAuthProvider('user-1', 'google', 'google-victim', {
      email: 'victim@example.com',
      emailVerified: true,
      displayName: 'Victim',
    })

    expect(db.query).toHaveBeenCalledTimes(3)
    expect(db.query.mock.calls[2][1]).toEqual([
      'google-victim',
      'victim@example.com',
      true,
      'Victim',
      'user-1',
    ])
  })

  it('rejects assigning a provider email already used by another account', async () => {
    db.query
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({
        rows: [{
          email: null,
          google_id: null,
          github_id: null,
        }],
      })
      .mockResolvedValueOnce({ rows: [{ id: 'user-2' }] })

    await expect(linkOAuthProvider('user-1', 'github', 'github-user', {
      email: 'taken@example.com',
      emailVerified: true,
      displayName: 'GitHub User',
    })).rejects.toMatchObject({
      code: 'EMAIL_TAKEN',
    })

    expect(db.query).toHaveBeenCalledTimes(3)
  })
})
