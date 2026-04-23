'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, ClipboardList, LogOut } from 'lucide-react'
import { useAuth } from './AuthProvider'

export default function Sidebar() {
  const path = usePathname()
  const { logout } = useAuth()

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <Link href="/dashboard" className="logo-mark" style={{ textDecoration: 'none' }}>
          <div className="logo-text">BroDOC</div>
        </Link>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Workspace</div>

        <Link
          href="/dashboard"
          className={`nav-link ${path === '/dashboard' ? 'active' : ''}`}
        >
          <LayoutDashboard className="nav-icon" />
          Dashboard
        </Link>

        <Link
          href="/job-details"
          className={`nav-link ${path.startsWith('/job-details') || path.startsWith('/jobs/') ? 'active' : ''}`}
        >
          <ClipboardList className="nav-icon" />
          Job Details
        </Link>
      </nav>

      {/* Developed By */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: 'var(--radius-md)',
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: 10, color: 'var(--green-primary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Developed By</div>
          <div style={{ fontSize: 13, color: '#FFFFFF', fontWeight: 600 }}>ER Sanamdeep Singh</div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>NIT Srinagar</div>
        </div>
      </div>

      {/* Logout */}
      <div style={{ padding: '0 16px 16px' }}>
        <button
          onClick={logout}
          className="nav-link"
          style={{
            width: '100%',
            background: 'rgba(219, 48, 48, 0.1)',
            border: '1px solid rgba(219, 48, 48, 0.2)',
            borderRadius: 'var(--radius-sm)',
            color: '#FF6B6B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            fontWeight: 600,
            fontFamily: 'inherit',
          }}
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      <div className="sidebar-footer">
        BroDoc v1.0.0 · Predusk Technology
      </div>
    </aside>
  )
}