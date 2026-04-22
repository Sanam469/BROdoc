'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { listJobs, JobsResponse, Job, formatRelative, formatFileSize } from '@/lib/api'
import { FileText, Image as ImageIcon, File, Archive, ChevronLeft, ChevronRight, Inbox } from 'lucide-react'

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

export default function JobDetailsPage() {
  const router = useRouter()
  const [data, setData] = useState<JobsResponse>({ items: [], total: 0, page: 1, per_page: 20, total_pages: 0 })
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)

  const reload = useCallback(async (pageNum: number) => {
    setLoading(true)
    try {

      const res = await listJobs({ status: 'finalized', page: pageNum, per_page: 20 })
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    reload(page)
  }, [page, reload])

  return (
    <>
      <div className="page-header" style={{ padding: '24px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            background: 'var(--bg-page)',
            padding: 8,
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)'
          }}>
            <Archive size={20} className="text-muted" />
          </div>
          <div>
            <h1 style={{ fontSize: 20, fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>Finalized Archive</h1>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)', margin: '4px 0 0' }}>All successfully processed and verified documents.</p>
          </div>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Total Finalized: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{data.total}</span>
          </div>
        </div>
      </div>

      <div style={{ padding: '0 32px 32px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="table-wrapper" style={{ flex: 1 }}>
          {loading && data.items.length === 0 ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}>
              <span className="spinner" style={{ width: 24, height: 24 }} />
            </div>
          ) : data.items.length === 0 ? (
            <div className="empty-state">
              <Inbox size={48} strokeWidth={1} className="empty-icon" />
              <div className="empty-title">No finalized documents</div>
              <div className="empty-desc">Process and review documents in the dashboard to see them here.</div>
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
                </tr>
              </thead>
              <tbody>
                {data.items.map((job, i) => (
                  <tr
                    key={job.id}
                    onClick={() => router.push(`/jobs/${job.id}`)}
                    style={{ animationDelay: `${i * 30}ms`, cursor: 'pointer' }}
                    className="animate-fadeinup"
                  >
                    <td><FileIcon type={job.file_type} /></td>
                    <td>
                      <div style={{ fontWeight: 600, maxWidth: 240 }} className="truncate" title={job.filename}>{job.filename}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{job.id.slice(0, 8)}…</div>
                    </td>
                    <td><Badge status={job.status} /></td>
                    <td><span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)' }}>{job.current_stage || '—'}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{formatFileSize(job.file_size)}</td>
                    <td><span style={{ color: 'var(--text-secondary)' }} title={job.created_at}>{formatRelative(job.created_at)}</span></td>
                    <td>{job.retry_count > 0 ? <span style={{ color: 'var(--status-failed)', fontWeight: 700 }}>×{job.retry_count}</span> : <span style={{ color: 'var(--text-muted)' }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {}
        {data.total_pages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 12, marginTop: 24 }}>
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={page === 1} 
              onClick={() => setPage(p => p - 1)}
            >
              <ChevronLeft size={16} /> Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>
              Page {page} of {data.total_pages}
            </span>
            <button 
              className="btn btn-secondary btn-sm" 
              disabled={page === data.total_pages} 
              onClick={() => setPage(p => p + 1)}
            >
              Next <ChevronRight size={16} />
            </button>
          </div>
        )}
      </div>
    </>
  )
}