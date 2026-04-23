'use client'
import { useCallback, useState } from 'react'
import { uploadDocuments } from '@/lib/api'
import { useRouter } from 'next/navigation'
import { CloudUpload, UploadCloud, FileUp, File, FileText, Image as ImageIcon, X, AlertTriangle, CheckCircle } from 'lucide-react'

const ACCEPTED = ['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg']

export default function UploadZone() {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles]       = useState<File[]>([])
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [success, setSuccess]   = useState<string | null>(null)
  const router = useRouter()

  const addFiles = useCallback((incoming: FileList | null) => {
    if (!incoming) return
    const valid = Array.from(incoming).filter(f => {
      const ext = '.' + f.name.split('.').pop()!.toLowerCase()
      return ACCEPTED.includes(ext)
    })
    setFiles(prev => {
      const names = new Set(prev.map(f => f.name))
      return [...prev, ...valid.filter(f => !names.has(f.name))]
    })
  }, [])

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [addFiles])

  const removeFile = (name: string) =>
    setFiles(prev => prev.filter(f => f.name !== name))

  const handleUpload = async () => {
    if (!files.length) return
    setLoading(true); setError(null); setSuccess(null)
    try {
      const result = await uploadDocuments(files)
      setSuccess(`${result.length} job${result.length > 1 ? 's' : ''} queued successfully! Redirecting to dashboard...`)
      setFiles([])
      setTimeout(() => router.push('/dashboard'), 1500)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const getFileIcon = (name: string) => {
    if (name.endsWith('.pdf')) return <FileText className="text-muted" size={24} />
    if (name.match(/\.(png|jpg|jpeg)$/i)) return <ImageIcon className="text-muted" size={24} />
    return <File className="text-muted" size={24} />
  }

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
        style={{
          border: `2px dashed ${dragging ? 'var(--green-primary)' : 'var(--border-dark)'}`,
          borderRadius: 'var(--radius-lg)',
          padding: '56px 32px',
          textAlign: 'center',
          cursor: 'pointer',
          background: dragging ? 'rgba(0,237,100,0.04)' : 'var(--bg-page)',
          transition: 'var(--transition-smooth)',
          transform: dragging ? 'scale(1.01)' : 'scale(1)',
        }}
      >
        <input
          id="file-input"
          type="file"
          multiple
          accept={ACCEPTED.join(',')}
          style={{ display: 'none' }}
          onChange={e => addFiles(e.target.files)}
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, color: dragging ? 'var(--green-dark)' : 'var(--text-muted)' }}>
          {dragging ? <UploadCloud size={48} strokeWidth={1.5} /> : <CloudUpload size={48} strokeWidth={1.5} />}
        </div>
        <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 8 }}>
          {dragging ? 'Drop files here' : 'Drop documents or click to browse'}
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>
          Supports PDF, DOCX, DOC, TXT, PNG, JPG &nbsp;·&nbsp; Up to 20 MB per file
        </div>
        <button
          className="btn btn-secondary"
          onClick={e => { e.stopPropagation(); document.getElementById('file-input')?.click() }}
          type="button"
        >
          <FileUp size={16} /> Select Files
        </button>
      </div>

      {}
      {files.length > 0 && (
        <div style={{ marginTop: 24 }} className="animate-fadeinup">
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            {files.length} FILE{files.length > 1 ? 'S' : ''} READY
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {files.map(f => (
              <div key={f.name} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '12px 16px',
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                animation: 'fadeInUp 0.3s ease forwards',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {getFileIcon(f.name)}
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }} className="truncate" title={f.name}>{f.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      {(f.size / 1024).toFixed(1)} KB
                    </div>
                  </div>
                </div>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => removeFile(f.name)}
                  title="Remove"
                  style={{ padding: 6 }}
                ><X size={16} /></button>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost" onClick={() => setFiles([])} disabled={loading}>
              Clear All
            </button>
            <button className="btn btn-primary btn-lg" onClick={handleUpload} disabled={loading}>
              {loading
                ? <><span className="spinner" style={{ width: 16, height: 16 }} /> Processing...</>
                : <><CloudUpload size={18} /> Upload {files.length} File{files.length > 1 ? 's' : ''}</>
              }
            </button>
          </div>
        </div>
      )}

      {}
      {error   && <div className="alert alert-error animate-fadein"   style={{ marginTop: 20 }}><AlertTriangle size={16} /> {error}</div>}
      {success && <div className="alert alert-success animate-fadein" style={{ marginTop: 20 }}><CheckCircle size={16} /> {success}</div>}
    </div>
  )
}