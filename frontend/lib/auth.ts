const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const TOKEN_KEY = 'brodoc_token'

export interface AuthUser {
  id: string
  email: string
  full_name: string
  created_at: string
}

export function getToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

export async function login(email: string, password: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Login failed')
  }
  const data = await res.json()
  setToken(data.access_token)
  return data.access_token
}

export async function register(email: string, password: string, full_name: string): Promise<string> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, full_name }),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || 'Registration failed')
  }
  const data = await res.json()
  setToken(data.access_token)
  return data.access_token
}

export async function getMe(): Promise<AuthUser> {
  const token = getToken()
  if (!token) throw new Error('Not authenticated')

  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      throw new Error('Session expired')
    }
    throw new Error('Failed to fetch user')
  }
  return res.json()
}

export function logout(): void {
  clearToken()
}
