'use client'
import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  listJobs, uploadDocuments, JobsResponse, Job, deleteJob,
  formatFileSize, formatRelative, ListJobsParams
} from '@/lib/api'
import { useSSE } from '@/hooks/useSSE'
import { useAuth } from '@/components/AuthProvider'
import ProgressTracker from '@/components/ProgressTracker'
import { FileText, Image as ImageIcon, File, Activity, X, ArrowRight, ArrowLeft, CloudUpload, UploadCloud, Upload, AlertTriangle, Search, Inbox, ChevronLeft, ChevronRight, XCircle, Trash2, CheckCircle2, Clock, AlertCircle, Database } from 'lucide-react'

function Badge({ status }: { status: Job['status'] }) {
  const L: Record<string, string> = {
    queued: 'Queued', processing: 'Processing',
    completed: 'Completed', failed: 'Failed', finalized: 'Finalized',
  }
  return <span className={`badge badge-${status}`}><span className="badge-dot" />{L[status]}</span>
}

function FileIcon({ type }: { type: string }) {
  if (type.toLowerCase() === '.pdf') return <FileText className="text-muted" size={18} />
  if (['.png', '.jpg', '.jpeg'].includes(type.toLowerCase())) return <ImageIcon className="text-muted" size={18} />
  return <File className="text-muted" size={18} />
}

function ProgressPanel({ jobId, onClose }: { jobId: string; onClose: () => void }) {
  const [job, setJob] = useState<Job | null>(null)
  const [mounted, setMounted] = useState(false)
  const { events, connected } = useSSE(jobId, true)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    let alive = true
    let id: ReturnType<typeof setInterval>

    const load = async () => {
      try {
        const { getJob } = await import('@/lib/api')
        const j = await getJob(jobId)
        if (alive) {
          setJob(j)

          if (j.status !== 'queued' && j.status !== 'processing') {
            clearInterval(id)
          }
        }
      } catch { }
    }

    load()
    id = setInterval(load, 2500)
    return () => { alive = false; clearInterval(id) }
  }, [jobId])

  return (
    <div style={{
      width: 320, flexShrink: 0,
      background: 'var(--white)',
      border: '1px solid var(--border)',
      borderRadius: 'var(--radius-lg)',
      boxShadow: 'var(--shadow-lg)',
      display: 'flex', flexDirection: 'column',
      maxHeight: 'calc(100vh - 140px)',
      position: 'sticky', top: 76,
      animation: 'slideInRight 0.3s cubic-bezier(0.4,0,0.2,1)',
    }}>
      { }
      <div style={{
        padding: '14px 16px', borderBottom: '1px solid var(--border)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Activity size={16} color="var(--green-dark)" />
          <span style={{ fontWeight: 600, fontSize: 13 }}>Live Progress</span>
          {connected && (
            <span style={{
              width: 6, height: 6, borderRadius: '50%',
              background: 'var(--green-primary)',
              display: 'inline-block', animation: 'pulse 1.5s infinite',
            }} />
          )}
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onClose} style={{ padding: '4px' }}><X size={16} /></button>
      </div>

      { }
      {job && (
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--bg-page)' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Processing</div>
          <div style={{ fontSize: 13, fontWeight: 600, marginTop: 4 }} className="truncate">{job.filename}</div>
          <div style={{ marginTop: 8 }}><Badge status={job.status} /></div>
        </div>
      )}

      { }
      <div style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <ProgressTracker
          currentStage={job?.current_stage ?? 'job_queued'}
          events={events}
          status={job?.status ?? 'queued'}
        />
      </div>

      { }
      {events.length > 0 && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 16px', maxHeight: 140, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>Event Log</div>
          {[...events].reverse().map((ev) => (
            <div key={ev.timestamp + ev.stage} style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', paddingBottom: 4, borderBottom: '1px dashed var(--border)', display: 'flex', gap: 8 }}>
              <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{mounted ? new Date(ev.timestamp).toLocaleTimeString() : '...'}</span>
              <span>{ev.message}</span>
            </div>
          ))}
        </div>
      )}

      { }
      {job && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
          <a href={`/jobs/${job.id}`} className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
            View Full Details <ArrowRight size={14} />
          </a>
        </div>
      )}
    </div>
  )
}

function InlineUpload({ onUploaded }: { onUploaded: (id: string) => void }) {
  const [dragging, setDragging] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const ACCEPTED = ['.pdf', '.docx', '.doc', '.txt', '.png', '.jpg', '.jpeg']

  const addFiles = (fl: FileList | null) => {
    if (!fl) return
    const valid = Array.from(fl).filter(f => ACCEPTED.includes('.' + f.name.split('.').pop()!.toLowerCase()))
    setFiles(prev => { const names = new Set(prev.map(f => f.name)); return [...prev, ...valid.filter(f => !names.has(f.name))] })
  }

  const handleUpload = async () => {
    if (!files.length) return
    setLoading(true); setError(null)
    try {
      const res = await uploadDocuments(files)
      setFiles([])
      if (res.length > 0) onUploaded(res[0].job_id)
    } catch (e: any) { setError(e.message) }
    finally { setLoading(false) }
  }

  return (
    <div style={{ padding: '0 0 16px', animation: 'slideDown 0.25s ease' }}>
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        { }
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files) }}
          onClick={() => document.getElementById('dash-file-input')?.click()}
          style={{
            flex: 1, minWidth: 240,
            border: `2px dashed ${dragging ? 'var(--green-primary)' : 'var(--border-dark)'}`,
            borderRadius: 'var(--radius-lg)',
            padding: '24px 20px',
            cursor: 'pointer',
            background: dragging ? 'rgba(0,237,100,0.04)' : 'var(--bg-page)',
            transition: 'var(--transition-fast)',
            textAlign: 'center',
          }}
        >
          <input id="dash-file-input" type="file" multiple accept={ACCEPTED.join(',')} style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12, color: dragging ? 'var(--green-dark)' : 'var(--text-muted)' }}>
            {dragging ? <UploadCloud size={32} /> : <CloudUpload size={32} />}
          </div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>Drop files or click to browse</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 6 }}>PDF, DOCX, TXT, PNG, JPG · Max 20 MB</div>
        </div>

        { }
        {files.length > 0 && (
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              {files.length} file{files.length > 1 ? 's' : ''} ready
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
              {files.map(f => (
                <div key={f.name} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', background: 'var(--white)',
                  border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
                }}>
                  <span style={{ fontSize: 13, fontWeight: 500 }} className="truncate">{f.name}</span>
                  <button className="btn btn-ghost btn-sm" onClick={() => setFiles(p => p.filter(x => x.name !== f.name))} style={{ padding: 4, flexShrink: 0 }}><X size={14} /></button>
                </div>
              ))}
            </div>
            <button className="btn btn-primary w-full" style={{ width: '100%', justifyContent: 'center' }} onClick={handleUpload} disabled={loading}>
              {loading ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Uploading...</> : <><Upload size={14} /> Upload {files.length} File{files.length > 1 ? 's' : ''}</>}
            </button>
          </div>
        )}
      </div>
      {error && <div className="alert alert-error" style={{ marginTop: 16 }}><AlertTriangle size={16} /> {error}</div>}
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [data, setData] = useState<JobsResponse>({ items: [], total: 0, page: 1, per_page: 20, total_pages: 0 })
  const [loading, setLoading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [activeJobId, setActiveJobId] = useState<string | null>(null)
  const [params, setParams] = useState<ListJobsParams>({ sort_by: 'created_at', order: 'desc', page: 1, per_page: 20 })
  const searchRef = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => { setMounted(true) }, [])

  const reload = useCallback(async (p: ListJobsParams) => {
    setLoading(true)
    try { setData(await listJobs(p)) } catch { } finally { setLoading(false) }
  }, [])

  useEffect(() => { reload(params) }, [])

  useEffect(() => {
    const hasActiveJobs = data.items.some(j => j.status === 'queued' || j.status === 'processing')
    if (!hasActiveJobs) return

    const id = setInterval(() => reload(params), 4000)
    return () => clearInterval(id)
  }, [params, reload, data.items])

  const update = (patch: Partial<ListJobsParams>) => {
    const next = { ...params, ...patch, page: 1 }
    setParams(next); reload(next)
  }

  const [jobToDelete, setJobToDelete] = useState<string | null>(null)

  const onSearch = (val: string) => {
    clearTimeout(searchRef.current)
    searchRef.current = setTimeout(() => update({ search: val || undefined }), 350)
  }

  const triggerDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setJobToDelete(id)
  }

  const confirmDelete = async () => {
    if (!jobToDelete) return
    const id = jobToDelete
    setJobToDelete(null)

    setData(prev => ({ ...prev, items: prev.items.filter(j => j.id !== id), total: prev.total - 1 }))

    try {
      await deleteJob(id)
      if (activeJobId === id) setActiveJobId(null)
      reload(params)
    } catch (err: any) {
      alert("Failed to delete job: " + err.message)
      reload(params)
    }
  }
  const handleUploaded = (jobId: string) => {
    setShowUpload(false)
    setActiveJobId(jobId)
    reload(params)
  }

  const counts = { processing: 0, completed: 0, failed: 0, finalized: 0 }
  data.items.forEach(j => {
    if (j.status === 'completed' || j.status === 'finalized') {
      counts.completed += 1
    } else {
      (counts as any)[j.status] = ((counts as any)[j.status] || 0) + 1
    }
  })
  return (
    <>
      { }
      <div className="page-header" style={{ padding: '16px 32px', gap: 16 }}>
        { }
        <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search files..."
            style={{ paddingLeft: 36, height: 38 }}
            onChange={e => onSearch(e.target.value)}
          />
        </div>

        { }
        <select className="select" style={{ maxWidth: 140, height: 38 }} onChange={e => update({ status: e.target.value || undefined })}>
          <option value="">All Status</option>
          {['queued', 'processing', 'completed', 'failed', 'finalized'].map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>

        <select className="select" style={{ maxWidth: 160, height: 38 }} onChange={e => { const [col, ord] = e.target.value.split(':'); update({ sort_by: col, order: ord }) }}>
          <option value="created_at:desc">Newest first</option>
          <option value="created_at:asc">Oldest first</option>
          <option value="filename:asc">Name A→Z</option>
          <option value="file_size:desc">Largest first</option>
          <option value="status:asc">By status</option>
        </select>

        {loading && <span className="spinner" style={{ width: 16, height: 16 }} />}

        { }
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16 }}>
          <button
            className={`btn ${showUpload ? 'btn-secondary' : 'btn-primary'}`}
            onClick={() => setShowUpload(p => !p)}
            style={{ flexShrink: 0 }}
          >
            {showUpload ? <><XCircle size={16} /> Cancel</> : <><Upload size={16} /> Upload</>}
          </button>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingLeft: 16, borderLeft: '1px solid var(--border)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{user.full_name}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{user.email}</div>
              </div>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: 'rgba(0,237,100,0.1)', color: 'var(--green-dark)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: 16, border: '1px solid rgba(0,237,100,0.2)'
              }}>
                {user.full_name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>
      </div>

      { }
      <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>

        { }
        <div className="stats-grid">
          {[
            { label: 'Total Jobs', val: data.total, icon: <Database size={20} />, bg: 'var(--status-queued-bg)', col: 'var(--text-muted)' },
            { label: 'Processing', val: counts.processing, icon: <Clock size={20} />, bg: 'var(--status-processing-bg)', col: 'var(--blue-accent)' },
            { label: 'Completed', val: counts.completed, icon: <CheckCircle2 size={20} />, bg: 'var(--status-completed-bg)', col: 'var(--green-dark)' },
            { label: 'Failed', val: counts.failed, icon: <AlertCircle size={20} />, bg: 'var(--status-failed-bg)', col: 'var(--status-failed)' },
          ].map((s, i) => (
            <div key={s.label} className="stat-card animate-fadeinup" style={{ animationDelay: `${i * 50}ms` }}>
              <div className="stat-icon-box" style={{ background: s.bg, color: s.col }}>
                {s.icon}
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.val}</div>
              </div>
            </div>
          ))}
        </div>

        { }
        {showUpload && (
          <div className="card animate-fadeinup" style={{ padding: '24px 32px' }}>
            <InlineUpload onUploaded={handleUploaded} />
          </div>
        )}

        { }
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start' }}>

          { }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="table-wrapper">
              {data.items.length === 0 ? (
                <div className="empty-state">
                  <Inbox size={48} strokeWidth={1} className="empty-icon" />
                  <div className="empty-title">No jobs yet</div>
                  <div className="empty-desc">Click Upload above to process your first document.</div>
                </div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 40 }}></th>
                      <th>Filename</th>
                      <th>Status</th>
                      <th>Stage</th>
                      <th>Size</th>
                      <th>Created</th>
                      <th>Retries</th>
                      <th style={{ width: 60 }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.items.map((job, i) => {
                      const canDelete = job.status !== 'queued' && job.status !== 'processing'
                      return (
                        <tr
                          key={job.id}
                          onClick={() => {
                            if (job.status === 'processing' || job.status === 'queued') {
                              setActiveJobId(job.id)
                            } else {
                              router.push(`/jobs/${job.id}`)
                            }
                          }}
                          style={{ animationDelay: `${i * 30}ms`, cursor: 'pointer' }}
                          className="animate-fadeinup group"
                        >
                          <td><FileIcon type={job.file_type} /></td>
                          <td>
                            <div style={{ fontWeight: 600, maxWidth: 240 }} className="truncate" title={job.filename}>{job.filename}</div>
                            <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                              {mounted ? new Date(job.created_at).toLocaleDateString() : '...'}
                            </div>
                          </td>
                          <td><Badge status={job.status} /></td>
                          <td><span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{job.current_stage || '—'}</span></td>
                          <td style={{ color: 'var(--text-secondary)' }}>{formatFileSize(job.file_size)}</td>
                          <td><span style={{ color: 'var(--text-secondary)' }} title={job.created_at}>{mounted ? formatRelative(job.created_at) : '...'}</span></td>
                          <td>{job.retry_count > 0 ? <span style={{ color: 'var(--status-failed)', fontWeight: 700 }}>×{job.retry_count}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                          <td>
                            {canDelete && (
                              <button
                                className="btn btn-ghost btn-sm"
                                style={{ color: 'var(--status-failed)', padding: '4px', opacity: 0.6 }}
                                onClick={(e) => triggerDelete(job.id, e)}
                                title="Delete Document"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              )}
            </div>

            { }
            {data.total_pages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
                <button className="btn btn-secondary btn-sm" disabled={params.page === 1} onClick={() => { const n = { ...params, page: params.page! - 1 }; setParams(n); reload(n) }}><ChevronLeft size={16} /> Prev</button>
                <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>Page {params.page} of {data.total_pages}</span>
                <button className="btn btn-secondary btn-sm" disabled={params.page === data.total_pages} onClick={() => { const n = { ...params, page: params.page! + 1 }; setParams(n); reload(n) }}>Next <ChevronRight size={16} /></button>
              </div>
            )}
          </div>

          { }
          {activeJobId && (
            <ProgressPanel
              key={activeJobId}
              jobId={activeJobId}
              onClose={() => setActiveJobId(null)}
            />
          )}
        </div>
      </div>

      { }
      {jobToDelete && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div style={{ background: 'var(--bg-page)', padding: 24, borderRadius: 'var(--radius-lg)', maxWidth: 400, border: '1px solid var(--border)', boxShadow: '0 8px 32px rgba(0,0,0,0.2)', animation: 'fadeinup 0.15s ease-out' }}>
            <h3 style={{ margin: '0 0 8px 0', fontSize: 18, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Trash2 size={20} color="var(--status-failed)" /> Delete Document
            </h3>
            <p style={{ margin: '0 0 24px 0', fontSize: 14, color: 'var(--text-secondary)' }}>Are you sure you want to permanently delete this document and its data? This cannot be undone.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="btn btn-secondary" onClick={() => setJobToDelete(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={confirmDelete}>Delete Permanently</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideDown {
          from { opacity:0; transform:translateY(-10px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes slideInRight {
          from { opacity:0; transform:translateX(24px); }
          to   { opacity:1; transform:translateX(0); }
        }
      `}</style>
    </>
  )
}