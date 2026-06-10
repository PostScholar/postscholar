/** @type {import('next').NextConfig} */
const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'

const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  turbopack: {
    root: import.meta.dirname,
  },
  // Proxy API through the frontend origin so session cookies work on
  // mobile Safari (blocks cross-site cookies to Railway).
  async rewrites() {
    return [
      { source: '/api/:path*', destination: `${apiUrl}/:path*` },
    ]
  },
}

export default nextConfig
