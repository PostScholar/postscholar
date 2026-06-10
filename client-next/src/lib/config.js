const DEFAULT_API_URL = 'http://localhost:3000'

function isLocalApiUrl(url) {
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url)
}

export function getApiUrl() {
  const configured = process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_URL

  // Local dev: proxy via Next.js (/api) so auth cookies stay same-origin
  if (typeof window !== 'undefined' && isLocalApiUrl(configured)) {
    return '/api'
  }

  return configured
}

export function getServerApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}
