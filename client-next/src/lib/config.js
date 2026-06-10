const DEFAULT_API_URL = 'http://localhost:3000'

export function getApiUrl() {
  // Browser: always same-origin proxy — required for mobile Safari cookies
  if (typeof window !== 'undefined') {
    return '/api'
  }

  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_URL
}

export function getServerApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}
