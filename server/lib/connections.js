const PROVIDERS = ['password', 'google', 'github', 'orcid']

function countSignInMethods(user) {
  let count = 0
  if (user.password_hash) count++
  if (user.google_id) count++
  if (user.github_id) count++
  if (user.orcid_id) count++
  return count
}

function isProviderLinked(user, provider) {
  switch (provider) {
    case 'password':
      return !!user.password_hash
    case 'google':
      return !!user.google_id
    case 'github':
      return !!user.github_id
    case 'orcid':
      return !!user.orcid_id
    default:
      return false
  }
}

function canUnlinkProvider(user, provider) {
  if (!PROVIDERS.includes(provider)) return false
  if (!isProviderLinked(user, provider)) return false
  return countSignInMethods(user) > 1
}

function buildConnectionsResponse(user) {
  const methodCount = countSignInMethods(user)

  const items = [
    {
      provider: 'password',
      label: 'Email & password',
      linked: !!user.password_hash,
      detail: user.password_hash && user.email ? user.email : null,
      verified: user.password_hash ? user.email_verified : null,
      can_unlink: canUnlinkProvider(user, 'password'),
      can_link: !user.password_hash,
      needs_email_for_password: !user.password_hash && !user.email,
    },
    {
      provider: 'google',
      label: 'Google',
      linked: !!user.google_id,
      detail: user.google_id ? (user.email || 'Google account') : null,
      can_unlink: canUnlinkProvider(user, 'google'),
      can_link: !user.google_id,
    },
    {
      provider: 'github',
      label: 'GitHub',
      linked: !!user.github_id,
      detail: user.github_id ? 'GitHub account' : null,
      can_unlink: canUnlinkProvider(user, 'github'),
      can_link: !user.github_id,
    },
    {
      provider: 'orcid',
      label: 'ORCID',
      linked: !!user.orcid_id,
      detail: user.orcid_id || null,
      can_unlink: canUnlinkProvider(user, 'orcid'),
      can_link: !user.orcid_id,
    },
  ]

  return {
    email: user.email || null,
    email_verified: user.email_verified,
    sign_in_method_count: methodCount,
    connections: items,
  }
}

module.exports = {
  PROVIDERS,
  countSignInMethods,
  isProviderLinked,
  canUnlinkProvider,
  buildConnectionsResponse,
}
