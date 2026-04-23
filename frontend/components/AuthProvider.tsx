'use client'
import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { getToken, getMe, logout as doLogout, AuthUser } from '@/lib/auth'

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: () => {},
})

export function useAuth() {
  return useContext(AuthContext)
}

// Pages that don't require authentication
const PUBLIC_PATHS = ['/', '/login']

export default function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const token = getToken()
    const isPublic = PUBLIC_PATHS.includes(pathname)

    if (!token) {
      setLoading(false)
      if (!isPublic) {
        router.replace('/login')
      }
      return
    }

    // Has token — validate it
    getMe()
      .then((u) => {
        setUser(u)
        setLoading(false)
        if (pathname === '/login' || pathname === '/') {
          router.replace('/dashboard')
        }
      })
      .catch(() => {
        setUser(null)
        setLoading(false)
        if (!isPublic) {
          router.replace('/login')
        }
      })
  }, [pathname, router])

  const handleLogout = () => {
    setLoading(true)
    
    // Artificial delay to ensure the smooth loading transition is visible
    setTimeout(() => {
      setUser(null)
      doLogout()
      router.replace('/login')
    }, 500)
  }

  return (
    <AuthContext.Provider value={{ user, loading, logout: handleLogout }}>
      {loading ? (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', background: 'var(--bg-page)',
        }}>
          <div style={{ textAlign: 'center' }}>
            <span className="spinner" style={{ width: 32, height: 32, marginBottom: 16, display: 'block', margin: '0 auto 16px' }} />
            <span style={{ color: 'var(--text-muted)', fontSize: 14 }}>Loading BroDoc...</span>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  )
}
