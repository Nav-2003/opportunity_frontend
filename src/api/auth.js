const API_BASE = import.meta.env.VITE_API_BASE_URL ?? '/api'

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    ...options,
  })

  let data = null
  try {
    data = await response.json()
  } catch {
    data = null
  }

  if (!response.ok) {
    const message = data?.message ?? `Request failed (${response.status})`
    throw new Error(message)
  }

  return data
}

export async function sendOtp(email) {
  return request('/send_Otp/sendOtp', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })
}

export async function verifyOtp(email, otp) {
  return request('/verify_Otp/verifyOtp', {
    method: 'POST',
    body: JSON.stringify({ email, otp }),
  })
}

export async function signIn(email, password) {
  return request('/userSignIn/signIn', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function signUp(name, email, password, role) {
  return request('/userSignUp/signUp', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, role }),
  })
}

export async function forgetPassword(email, password) {
  return request('/forget/forgetPassword', {
    method: 'PUT',
    body: JSON.stringify({ email, password }),
  })
}

export async function refreshAccessToken(refreshToken) {
  return request('/refreshToken/refresh', {
    method: 'POST',
    body: JSON.stringify({ refreshToken }),
  })
}

const ACCESS_TOKEN_KEY = 'accessToken'
const REFRESH_TOKEN_KEY = 'refreshToken'
const USER_KEY = 'authUser'

export function saveAuthSession(accessToken, refreshToken, user) {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuthSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getStoredUser() {
  const raw = localStorage.getItem(USER_KEY)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken() {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export async function refreshSession() {
  const refreshToken = getRefreshToken()
  if (!refreshToken) {
    throw new Error('No refresh token available')
  }

  const { accessToken } = await refreshAccessToken(refreshToken)
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
  return accessToken
}
