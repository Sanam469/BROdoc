import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex-center" style={{ minHeight: '80vh', flexDirection: 'column', gap: 16 }}>
      <FileQuestion size={64} color="var(--border-dark)" strokeWidth={1.5} />
      <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-primary)' }}>Page not found</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 14 }}>The page you're looking for doesn't exist.</p>
      <Link href="/" className="btn btn-primary" style={{ marginTop: 8 }}><ArrowLeft size={16} /> Go to Upload</Link>
    </div>
  )
}