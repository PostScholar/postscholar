const DEFAULT_API_URL = 'http://localhost:3000'

export function getApiUrl() {
  return process.env.NEXT_PUBLIC_API_URL || process.env.API_URL || DEFAULT_API_URL
}

export function getServerApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}
