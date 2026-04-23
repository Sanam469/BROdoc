'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { login, register } from '@/lib/auth'
import { Mail, Lock, User, ArrowRight, AlertTriangle } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [isRegister, setIsRegister] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isRegister) {
        await register(email, password, fullName)
      } else {
        await login(email, password)
      }
      
      // Delay routing to dashboard to give a smooth visual transition
      setTimeout(() => {
        router.push('/dashboard')
      }, 500)
    } catch (err: any) {
      setError(err.message)
      setLoading(false)
    }
  }

  return (
    <div className="login-root">
      <div className="login-container">
        {/* Left Panel — Branding */}
        <div className="login-brand">
          <div className="brand-content">
            <div className="brand-logo">BroDOC</div>
            <p className="brand-tagline">
              Intelligent Document<br />
              <span className="brand-highlight">Workflows</span>
            </p>
            <p className="brand-desc">
              Scale your document intelligence with async processing, 
              live tracking, and AI-powered extraction.
            </p>
            <div className="brand-features">
              <div className="brand-feature"><span className="brand-check">✓</span> Gemini AI Extraction</div>
              <div className="brand-feature"><span className="brand-check">✓</span> Real-time Progress</div>
              <div className="brand-feature"><span className="brand-check">✓</span> Secure Per-User Docs</div>
            </div>
          </div>
          <div className="brand-footer">© 2026 BroDoc · Predusk Technology</div>
        </div>

        {/* Right Panel — Form */}
        <div className="login-form-panel">
          <form className="login-form" onSubmit={handleSubmit}>
            <h1 className="form-title">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h1>
            <p className="form-subtitle">
              {isRegister 
                ? 'Sign up to start processing your documents.' 
                : 'Sign in to access your documents.'}
            </p>

            {error && (
              <div className="alert alert-error" style={{ marginBottom: 20 }}>
                <AlertTriangle size={16} /> {error}
              </div>
            )}

            {isRegister && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <User size={16} className="input-icon" />
                  <input
                    id="auth-fullname"
                    className="input input-with-icon"
                    type="text"
                    placeholder="Your name"
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    required
                    autoComplete="name"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-wrapper">
                <Mail size={16} className="input-icon" />
                <input
                  id="auth-email"
                  className="input input-with-icon"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <Lock size={16} className="input-icon" />
                <input
                  id="auth-password"
                  className="input input-with-icon"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                />
              </div>
            </div>

            <button
              id="auth-submit"
              className="btn btn-primary btn-lg"
              type="submit"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
            >
              {loading ? (
                <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</>
              ) : (
                <>{isRegister ? 'Create Account' : 'Sign In'} <ArrowRight size={16} /></>
              )}
            </button>

            <div className="form-toggle">
              {isRegister ? (
                <>Already have an account?{' '}
                  <button type="button" className="toggle-link" onClick={() => {
                    setLoading(true)
                    setTimeout(() => { setIsRegister(false); setError(null); setLoading(false) }, 300)
                  }}>
                    Sign In
                  </button>
                </>
              ) : (
                <>Don&apos;t have an account?{' '}
                  <button type="button" className="toggle-link" onClick={() => {
                    setLoading(true)
                    setTimeout(() => { setIsRegister(true); setError(null); setLoading(false) }, 300)
                  }}>
                    Sign Up
                  </button>
                </>
              )}
            </div>
          </form>
        </div>
      </div>

      <style jsx>{`
        .login-root {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-page);
          background-image: radial-gradient(#e8edeb 1px, transparent 1px);
          background-size: 32px 32px;
          padding: 20px;
        }
        .login-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          max-width: 900px;
          width: 100%;
          min-height: 560px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 60px rgba(0, 30, 43, 0.15);
          border: 1px solid var(--border);
        }
        .login-brand {
          background: var(--navy);
          padding: 48px 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
        }
        .login-brand::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 70% 30%, rgba(0, 237, 100, 0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .brand-content { position: relative; z-index: 1; }
        .brand-logo {
          font-family: 'Pacifico', cursive;
          font-size: 42px;
          color: #FFFFFF;
          text-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
          margin-bottom: 32px;
        }
        .brand-tagline {
          font-size: 28px;
          font-weight: 800;
          color: #FFFFFF;
          line-height: 1.2;
          margin-bottom: 16px;
        }
        .brand-highlight {
          background: linear-gradient(135deg, var(--green-muted), var(--green-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .brand-desc {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          line-height: 1.7;
          margin-bottom: 32px;
          max-width: 320px;
        }
        .brand-features { display: flex; flex-direction: column; gap: 10px; }
        .brand-feature {
          font-size: 13px;
          color: rgba(255,255,255,0.7);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-check {
          color: var(--green-primary);
          font-weight: 700;
          font-size: 14px;
        }
        .brand-footer {
          font-size: 11px;
          color: rgba(255,255,255,0.3);
          position: relative;
          z-index: 1;
        }
        .login-form-panel {
          background: var(--white);
          padding: 48px 40px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .login-form {
          width: 100%;
          max-width: 340px;
        }
        .form-title {
          font-size: 24px;
          font-weight: 700;
          color: var(--text-primary);
          margin-bottom: 6px;
        }
        .form-subtitle {
          font-size: 14px;
          color: var(--text-muted);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        .input-wrapper {
          position: relative;
        }
        .input-icon {
          position: absolute;
          left: 14px;
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-muted);
          pointer-events: none;
        }
        .input-with-icon {
          padding-left: 40px !important;
        }
        .form-toggle {
          text-align: center;
          margin-top: 24px;
          font-size: 13px;
          color: var(--text-muted);
        }
        .toggle-link {
          background: none;
          border: none;
          color: var(--blue-accent);
          font-weight: 600;
          cursor: pointer;
          font-size: 13px;
          font-family: inherit;
          text-decoration: underline;
        }
        .toggle-link:hover {
          color: var(--navy);
        }
        @media (max-width: 768px) {
          .login-container {
            grid-template-columns: 1fr;
            max-width: 420px;
          }
          .login-brand {
            padding: 32px 24px;
          }
          .brand-tagline { font-size: 22px; }
          .brand-desc { display: none; }
          .brand-features { display: none; }
          .login-form-panel { padding: 32px 24px; }
        }
      `}</style>
    </div>
  )
}
