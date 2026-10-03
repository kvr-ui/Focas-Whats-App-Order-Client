// Backend URL comes from VITE_API_URL in client/.env. In dev, requests stay
// same-origin and Vite proxies /api to that URL; builds call it directly.
const BASE = import.meta.env.DEV ? '' : import.meta.env.VITE_API_URL || ''
const SESSION_KEY = 'adminSession'

// Session = { token, expiresAt, admin } from the login endpoints
export const getSession = () => {
  try {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY))
    return session?.token && session.expiresAt > Date.now() ? session : null
  } catch {
    return null
  }
}

export const setSession = (session) => {
  try {
    if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
    else localStorage.removeItem(SESSION_KEY)
  } catch {
    // storage blocked — session just won't persist across reloads
  }
}

export class AuthError extends Error {}

const request = async (path, { method = 'GET', body, token } = {}) => {
  const headers = {}
  if (body) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${BASE}/api${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })

  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    const message = data.error || `Request failed (${response.status})`
    throw token && response.status === 401 ? new AuthError(message) : new Error(message)
  }

  return data
}

export const api = (path) => request(`/admin${path}`, { token: getSession()?.token })

export const sendOtp = (phone) => request('/auth/send-otp', { method: 'POST', body: { phone } })

export const verifyOtp = (phone, otp) =>
  request('/auth/verify-otp', { method: 'POST', body: { phone, otp } })

export const loginWithPassword = (phone, password) =>
  request('/auth/login', { method: 'POST', body: { phone, password } })
