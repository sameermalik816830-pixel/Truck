const BASE = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/$/, '')

export const FILE_BASE = BASE.replace(/\/api$/, '')

async function request(path, { method = 'GET', body, form } = {}) {
  const options = { method, credentials: 'include', headers: {} }
  if (form) {
    options.body = form
  } else if (body !== undefined) {
    options.headers['Content-Type'] = 'application/json'
    options.body = JSON.stringify(body)
  }

  let response
  try {
    response = await fetch(`${BASE}${path}`, options)
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.')
  }

  let data = null
  try {
    data = await response.json()
  } catch {
  }

  if (!response.ok || (data && data.success === false)) {
    const error = new Error((data && data.message) || `Request failed (${response.status})`)
    error.status = response.status
    throw error
  }
  return data
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  del: (path) => request(path, { method: 'DELETE' }),
  postForm: (path, form) => request(path, { method: 'POST', form }),
  putForm: (path, form) => request(path, { method: 'PUT', form }),
}
