'use client'
import Link from 'next/link'
import { ArrowRight, Zap, Search, BarChart3 } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="landing-root">
      <div className="landing-container">
        <header className="landing-header animate-fadeinup">
          <div className="logo-mark">
            <div className="logo-text" style={{ color: 'var(--navy)' }}>BroDOC</div>
          </div>
        </header>

        <main className="landing-hero">
          <div className="hero-content animate-fadeinup" style={{ animationDelay: '0.1s' }}>
            <h1 className="hero-title">
              Intelligent Document <br/>
              <span className="text-gradient">Workflows</span>
            </h1>
            <p className="hero-subtitle">
              Scale your document intelligence with BroDoc. Automated extraction, 
              live tracking, and seamless validation powered by Gemini AI.
            </p>
            <div className="hero-actions">
              <Link href="/dashboard" className="btn btn-primary btn-lg">
                Get Started <ArrowRight size={18} />
              </Link>
              <div className="hero-meta">
                <div className="meta-item"><CheckCircle size={14}/> No setup required</div>
                <div className="meta-item"><CheckCircle size={14}/> Enterprise Ready</div>
              </div>
            </div>
          </div>

          <div className="hero-visual animate-fadeinup" style={{ animationDelay: '0.2s' }}>
            <div className="visual-card">
              <div className="visual-header">
                <div className="dot red"/> <div className="dot yellow"/> <div className="dot green"/>
              </div>
              <div className="visual-body">
                <div className="mock-row"><div className="mock-bar" style={{ width: '60%' }}/></div>
                <div className="mock-row"><div className="mock-bar" style={{ width: '80%' }}/></div>
                <div className="mock-row"><div className="mock-bar" style={{ width: '40%' }}/></div>
                <div className="mock-progress">
                  <div className="progress-fill" style={{ width: '75%' }}/>
                </div>
                <div className="mock-text">Extracting Intelligence... 75%</div>
              </div>
            </div>
          </div>
        </main>

        <section className="features-grid">
          {[
            { icon: <Zap/>, title: 'Async Speed', desc: 'Process thousands of docs in the background without blocking.' },
            { icon: <Search/>, title: 'Smart Search', desc: 'Find any document instantly with advanced status filtering.' },
            { icon: <BarChart3/>, title: 'Data Insight', desc: 'Get structured JSON/CSV intelligence from raw documents.' },
          ].map((f, i) => (
            <div key={f.title} className="feature-card animate-fadeinup" style={{ animationDelay: `${0.3 + i*0.1}s` }}>
              <div className="feature-icon">{f.icon}</div>
              <h3>{f.title}</h3>
              <p>{f.desc}</p>
            </div>
          ))}
        </section>
      </div>

      <footer className="landing-footer">
        © 2026 BroDoc · Predusk Technology · Built for scale
      </footer>

      <style jsx>{`
        .landing-root {
          min-height: 100vh;
          background: #ffffff;
          background-image: radial-gradient(#e8edeb 1px, transparent 1px);
          background-size: 32px 32px;
          display: flex;
          flex-direction: column;
        }
        .landing-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 32px;
          flex: 1;
        }
        .landing-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 0;
        }
        .landing-hero {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 64px;
          align-items: center;
          padding: 80px 0;
        }
        .hero-title {
          font-size: 56px;
          font-weight: 800;
          line-height: 1.1;
          color: var(--navy);
          margin-bottom: 24px;
        }
        .text-gradient {
          background: linear-gradient(135deg, var(--green-muted), var(--green-primary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .hero-subtitle {
          font-size: 18px;
          color: var(--text-secondary);
          max-width: 460px;
          margin-bottom: 40px;
          line-height: 1.6;
        }
        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .hero-meta {
          display: flex;
          gap: 20px;
          font-size: 12px;
          color: var(--text-muted);
        }
        .meta-item { display: flex; align-items: center; gap: 6px; }

        .visual-card {
          background: var(--navy);
          border-radius: var(--radius-lg);
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.1);
        }
        .visual-header {
          background: rgba(255,255,255,0.05);
          padding: 12px;
          display: flex;
          gap: 6px;
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .dot.red { background: #ff5f56; }
        .dot.yellow { background: #ffbd2e; }
        .dot.green { background: #27c93f; }
        .visual-body { padding: 32px; }
        .mock-row { background: rgba(255,255,255,0.05); height: 12px; border-radius: 6px; margin-bottom: 12px; }
        .mock-bar { background: var(--green-primary); height: 100%; border-radius: 6px; opacity: 0.3; }
        .mock-progress { background: rgba(255,255,255,0.1); height: 6px; border-radius: 3px; margin: 24px 0 12px; position: relative; overflow: hidden; }
        .progress-fill { background: var(--green-primary); height: 100%; box-shadow: 0 0 12px var(--green-primary); }
        .mock-text { color: var(--green-primary); font-family: var(--font-mono); font-size: 12px; text-align: center; }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 32px;
          padding: 80px 0;
          border-top: 1px solid var(--border);
        }
        .feature-card h3 { margin: 16px 0 8px; color: var(--navy); }
        .feature-card p { color: var(--text-secondary); line-height: 1.5; }
        .feature-icon { color: var(--green-muted); }

        .landing-footer {
          padding: 40px;
          text-align: center;
          font-size: 12px;
          color: var(--text-muted);
          border-top: 1px solid var(--border);
        }
      `}</style>
    </div>
  )
}

function CheckCircle({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  )
}