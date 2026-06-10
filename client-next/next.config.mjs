/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
const isLocalApi = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(apiUrl)

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  turbopack: {
    root: import.meta.dirname,
  },
  async rewrites() {
    if (!isLocalApi) return []
    return [
      { source: '/api/:path*', destination: `${apiUrl}/:path*` },
    ]
  },
}

export default nextConfig
