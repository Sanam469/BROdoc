'use client'
import { usePathname } from 'next/navigation'
import AuthProvider from './AuthProvider'
import Sidebar from './Sidebar'

const NO_SHELL_PATHS = ['/login', '/']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const showShell = !NO_SHELL_PATHS.includes(pathname)

  return (
    <AuthProvider>
      {showShell ? (
        <div className="layout">
          <Sidebar />
          <main className="main-content">
            {children}
          </main>
        </div>
      ) : (
        children
      )}
    </AuthProvider>
  )
}
