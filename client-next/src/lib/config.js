const DEFAULT_API_URL = 'http://localhost:3000'

/**
 * Get API URL for browser/client-side requests
 *
 * In production: Returns '/api' to use Next.js API proxy (same-origin, cookies work)
 * In development: Returns localhost backend URL for direct connection
 *
 * The /api proxy forwards requests to Cloudflare Workers backend, enabling
 * cookie-based authentication without CORS issues.
 */
export function getApiUrl() {
  // In browser context
  if (typeof window !== 'undefined') {
    // Production: use same-origin /api proxy
    if (process.env.NODE_ENV === 'production') {
      return '/api'
    }
    // Development: direct connection to local backend
    return process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
  }

  // Server-side: use full backend URL
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}

/**
 * Get API URL for server-side requests
 * Always returns the full backend URL for server-to-server communication
 */
export function getServerApiUrl() {
  return process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL
}
