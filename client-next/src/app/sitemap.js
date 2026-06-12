import { getServerApiUrl } from '@/lib/config'
import { buildDiscussionSlug } from '@/lib/discussionSlug'
import { SITE_URL } from '@/lib/site'

export default async function sitemap() {
  const staticPages = [
    { path: '', changeFrequency: 'daily', priority: 1 },
    { path: '/explore', changeFrequency: 'hourly', priority: 0.9 },
    { path: '/search', changeFrequency: 'weekly', priority: 0.7 },
    { path: '/start', changeFrequency: 'monthly', priority: 0.8 },
    { path: '/about', changeFrequency: 'monthly', priority: 0.6 },
    { path: '/privacy', changeFrequency: 'yearly', priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly', priority: 0.3 },
  ]

  const entries = staticPages.map(({ path, changeFrequency, priority }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
    changeFrequency,
    priority,
  }))

  try {
    const res = await fetch(`${getServerApiUrl()}/sitemap/discussions`, {
      next: { revalidate: 3600 },
    })

    if (res.ok) {
      const data = await res.json()
      for (const row of data.discussions || []) {
        entries.push({
          url: `${SITE_URL}/d/${buildDiscussionSlug(row.title, row.id)}`,
          lastModified: new Date(row.last_modified || row.created_at),
          changeFrequency: 'weekly',
          priority: 0.8,
        })
      }
    }
  } catch (error) {
    console.error('sitemap: failed to fetch discussions', error)
  }

  return entries
}
