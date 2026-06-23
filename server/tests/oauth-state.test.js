const request = require('supertest')
const app = require('../index')
const {
  OAUTH_NONCE_COOKIE,
  verifyOAuthState,
} = require('../lib/session')

const originalEnv = {
  JWT_SECRET: process.env.JWT_SECRET,
  CLIENT_URL: process.env.CLIENT_URL,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID,
  ORCID_CLIENT_ID: process.env.ORCID_CLIENT_ID,
}

const providers = [
  {
    provider: 'google',
    urlPath: '/auth/google/url',
    callbackPath: '/auth/google/callback',
    clientIdEnv: 'GOOGLE_CLIENT_ID',
  },
  {
    provider: 'github',
    urlPath: '/auth/github/url',
    callbackPath: '/auth/github/callback',
    clientIdEnv: 'GITHUB_CLIENT_ID',
  },
  {
    provider: 'orcid',
    urlPath: '/auth/orcid/login/url',
    callbackPath: '/auth/orcid/callback',
    clientIdEnv: 'ORCID_CLIENT_ID',
  },
]

function restoreEnv() {
  Object.entries(originalEnv).forEach(([key, value]) => {
    if (value === undefined) {
      delete process.env[key]
    } else {
      process.env[key] = value
    }
  })
}

function configureOAuth(provider) {
  process.env.JWT_SECRET = 'test-secret'
  process.env.CLIENT_URL = 'https://client.example.test'
  process.env[provider.clientIdEnv] = `${provider.provider}-client-id`
}

function stateFromUrl(url) {
  return new URL(url).searchParams.get('state')
}

function nonceCookieFrom(res) {
  return res.headers['set-cookie']?.find(cookie => (
    cookie.startsWith(`${OAUTH_NONCE_COOKIE}=`)
  ))
}

afterEach(() => {
  jest.restoreAllMocks()
  restoreEnv()
})

describe('OAuth login state nonce', () => {
  it.each(providers)('binds $provider login state to an httpOnly nonce cookie', async (provider) => {
    configureOAuth(provider)

    const res = await request(app).get(provider.urlPath)

    expect(res.status).toBe(200)
    expect(nonceCookieFrom(res)).toContain('HttpOnly')

    const statePayload = verifyOAuthState(stateFromUrl(res.body.url))
    expect(statePayload).toMatchObject({
      provider: provider.provider,
      mode: 'login',
    })
    expect(statePayload.nonce_hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it.each(providers)('rejects $provider login callbacks without the nonce cookie', async (provider) => {
    configureOAuth(provider)
    const fetchSpy = jest.spyOn(global, 'fetch')

    const urlRes = await request(app).get(provider.urlPath)
    const callbackRes = await request(app)
      .post(provider.callbackPath)
      .send({ code: 'attacker-code', state: stateFromUrl(urlRes.body.url) })

    expect(callbackRes.status).toBe(400)
    expect(callbackRes.body.error).toBe('Invalid or expired state')
    expect(fetchSpy).not.toHaveBeenCalled()
  })

  it.each(providers)('rejects $provider login callbacks with another browser nonce', async (provider) => {
    configureOAuth(provider)
    const fetchSpy = jest.spyOn(global, 'fetch')

    const urlRes = await request(app).get(provider.urlPath)
    const callbackRes = await request(app)
      .post(provider.callbackPath)
      .set('Cookie', `${OAUTH_NONCE_COOKIE}=wrong-browser-nonce`)
      .send({ code: 'attacker-code', state: stateFromUrl(urlRes.body.url) })

    expect(callbackRes.status).toBe(400)
    expect(callbackRes.body.error).toBe('Invalid or expired state')
    expect(fetchSpy).not.toHaveBeenCalled()
  })
})
