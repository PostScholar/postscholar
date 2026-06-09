/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
    API_URL: process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
  },
  turbopack: {
    root: import.meta.dirname,
  },
}

export default nextConfig
