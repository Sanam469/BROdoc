'use client'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Job, formatFileSize, formatRelative, ListJobsParams, listJobs, JobsResponse } from '@/lib/api'
import { FileText, Image as ImageIcon, File, Search, ArrowDown, ArrowUp, ArrowUpDown, Inbox, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react'

interface Props {
  initialData: JobsResponse
}

const STATUS_ORDER = ['queued','processing','completed','failed','finalized']

function StatusBadge({ status }: { status: Job['status'] }) {
  const labels: Record<string, string> = {
    queued: 'Queued', processing: 'Processing',
    completed: 'Completed', failed: 'Failed', finalized: 'Finalized'
  }
  return (
    <span className={`badge badge-${status}`}>
      <span className="badge-dot" />
      {labels[status] || status}
    </span>
  )
}

function FileIcon({ type }: { type: string }) {
  if (type.toLowerCase() === '.pdf') return <FileText className="text-muted" size={18} />
  if (['.png', '.jpg', '.jpeg'].includes(type.toLowerCase())) return <ImageIcon className="text-muted" size={18} />
  return <File className="text-muted" size={18} />
}

export default function JobsTable({ initialData }: Props) {
  const router = useRouter()
  const [data, setData]       = useState<JobsResponse>(initialData)
  const [loading, setLoading] = useState(false)
  const [params, setParams]   = useState<ListJobsParams>({
    sort_by: 'created_at', order: 'desc', page: 1, per_page: 20
  })

  const reload = useCallback(async (p: ListJobsParams) => {
    setLoading(true)
    try {
      const res = await listJobs(p)
      setData(res)
    } finally { setLoading(false) }
  }, [])

  const update = (patch: Partial<ListJobsParams>) => {
    const next = { ...params, ...patch, page: 1 }
    setParams(next)
    reload(next)
  }

  const sort = (col: string) => {
    const next = {
      ...params,
      sort_by: col,
      order: params.sort_by === col && params.order === 'desc' ? 'asc' : 'desc',
    }
    setParams(next)
    reload(next)
  }

  const SortIcon = ({ col }: { col: string }) => {
    if (params.sort_by !== col) return <ArrowUpDown size={14} style={{ opacity: 0.3, marginLeft: 4 }} />
    return params.order === 'desc' 
      ? <ArrowDown size={14} style={{ color: 'var(--green-primary)', marginLeft: 4 }} />
      : <ArrowUp size={14} style={{ color: 'var(--green-primary)', marginLeft: 4 }} />
  }

  const changePage = (p: number) => {
    const next = { ...params, page: p }
    setParams(next)
    reload(next)
  }

  return (
    <div>
      {}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', maxWidth: 280, width: '100%' }}>
          <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
          <input
            className="input"
            placeholder="Search by filename..."
            style={{ paddingLeft: 36 }}
            onChange={e => update({ search: e.target.value })}
          />
        </div>
        <select
          className="select"
          style={{ maxWidth: 160 }}
          onChange={e => update({ status: e.target.value || undefined })}
        >
          <option value="">All Statuses</option>
          {STATUS_ORDER.map(s => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {loading && <span className="spinner" />}
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {data.total} job{data.total !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {}
      <div className="table-wrapper">
        {data.items.length === 0 ? (
          <div className="empty-state">
            <Inbox size={48} strokeWidth={1} className="empty-icon" />
            <div className="empty-title">No jobs found</div>
            <div className="empty-desc">Upload a document to create your first processing job.</div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: 40 }}></th>
                <th className="sortable" onClick={() => sort('filename')} style={{ display: 'flex', alignItems: 'center' }}>
                  Filename <SortIcon col="filename" />
                </th>
                <th>Status</th>
                <th>Stage</th>
                <th className="sortable" onClick={() => sort('file_size')} style={{ display: 'flex', alignItems: 'center' }}>
                  Size <SortIcon col="file_size" />
                </th>
                <th style={{ width: 130 }}>Created</th>
                <th style={{ width: 80 }}>Retries</th>
                <th style={{ width: 50 }}></th>
              </tr>
            </thead>
            <tbody>
              {data.items.map((job, i) => (
                <tr
                  key={job.id}
                  style={{ animationDelay: `${i * 40}ms` }}
                  className="animate-fadeinup"
                >
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}><FileIcon type={job.file_type} /></td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                    <div style={{ fontWeight: 600, maxWidth: 200 }} className="truncate" title={job.filename}>
                      {job.filename}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                      {job.id.slice(0, 8)}...
                    </div>
                  </td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}><StatusBadge status={job.status} /></td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                    <span style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                      {job.current_stage || '—'}
                    </span>
                  </td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer', color: 'var(--text-secondary)' }}>{formatFileSize(job.file_size)}</td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                    <span title={job.created_at} style={{ color: 'var(--text-secondary)' }}>
                      {formatRelative(job.created_at)}
                    </span>
                  </td>
                  <td onClick={() => router.push(`/jobs/${job.id}`)} style={{ cursor: 'pointer' }}>
                    {job.retry_count > 0
                      ? <span style={{ color: 'var(--status-failed)', fontWeight: 600 }}>×{job.retry_count}</span>
                      : <span style={{ color: 'var(--text-muted)' }}>—</span>
                    }
                  </td>
                  <td style={{ width: 50, textAlign: 'center' }}>
                    <button 
                      className="btn btn-ghost btn-sm" 
                      style={{ 
                        color: 'var(--status-failed)', 
                        padding: '4px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%'
                      }}
                      title="Delete Job"
                      onClick={async (e) => {
                        e.stopPropagation();
                        if (confirm('Permanently delete this job?')) {
                          try {
                            const { deleteJob } = await import('@/lib/api');
                            await deleteJob(job.id);
                            reload(params);
                          } catch {
                            alert('Failed to delete job');
                          }
                        }
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 'bold' }}>DELETE</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {}
      {data.total_pages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
          <button className="btn btn-secondary btn-sm" disabled={params.page === 1} onClick={() => changePage(params.page! - 1)}>
            <ChevronLeft size={16} /> Prev
          </button>
          {Array.from({ length: data.total_pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              className={`btn btn-sm ${params.page === p ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => changePage(p)}
            >{p}</button>
          ))}
          <button className="btn btn-secondary btn-sm" disabled={params.page === data.total_pages} onClick={() => changePage(params.page! + 1)}>
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  )
}