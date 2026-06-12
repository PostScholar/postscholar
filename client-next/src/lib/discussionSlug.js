const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const UUID_ONLY_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export function slugifyTitle(title) {
  if (!title) return 'discussion'
  return title
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
    || 'discussion'
}

export function buildDiscussionSlug(title, id) {
  return `${slugifyTitle(title)}-${id}`
}

export function parseDiscussionId(slug) {
  if (!slug) return null
  if (UUID_ONLY_RE.test(slug)) return slug
  const match = slug.match(UUID_RE)
  return match ? match[0] : null
}

export function discussionPath({ id, title }) {
  if (!id) return '/explore'
  const slug = title ? buildDiscussionSlug(title, id) : id
  return `/d/${slug}`
}
