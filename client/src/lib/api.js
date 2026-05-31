const BASE_URL = import.meta.env.VITE_API_URL

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || 'request failed')
  }

  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (path) => request(path, { method: 'DELETE' })
}