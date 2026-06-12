import { SITE_URL } from '@/lib/site'

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/settings', '/moderation', '/login', '/register'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
