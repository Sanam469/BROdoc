'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useJob }               from '@/hooks/useJobs'
import { useSSE }               from '@/hooks/useSSE'
import ProgressTracker          from '@/components/ProgressTracker'
import ReviewEditor             from '@/components/ReviewEditor'
import ExportButtons            from '@/components/ExportButtons'
import { ExtractedData, finalizeJob, retryJob, formatFileSize, formatDate, Job } from '@/lib/api'
import Link from 'next/link'
import { AlertTriangle, ArrowLeft, RotateCcw, Lock, ClipboardList, PenTool, Download, Activity } from 'lucide-react'

function StatusBadge({ status }: { status: Job['status'] }) {
  const labels: Record<string, string> = {
    queued: 'Queued', processing: 'Processing',
    completed: 'Completed', failed: 'Failed', finalized: 'Finalized'
  }
  return <span className={`badge badge-${status}`}><span className="badge-dot" />{labels[status]}</span>
}

export default function JobDetailPage() {
  const { id }    = useParams<{ id: string }>()

  const { job, loading, error, refetch } = useJob(id, true)

  const sseEnabled = job?.status === 'queued' || job?.status === 'processing'
  const { events, connected } = useSSE(id, sseEnabled)

  useEffect(() => {
    const done = events.some(e => e.stage === 'job_completed' || e.stage === 'job_failed')
    if (done) setTimeout(refetch, 800)
  }, [events, refetch])

  const [finalizing, setFinalizing] = useState(false)
  const [retrying,   setRetrying]   = useState(false)
  const [actionErr,  setActionErr]  = useState<string | null>(null)

  const handleFinalize = async () => {
    setFinalizing(true); setActionErr(null)
    try { await finalizeJob(id); refetch() }
    catch (e: unknown) { setActionErr(e instanceof Error ? e.message : 'Finalize failed') }
    finally { setFinalizing(false) }
  }

  const handleRetry = async () => {
    setRetrying(true); setActionErr(null)
    try { await retryJob(id); refetch() }
    catch (e: unknown) { setActionErr(e instanceof Error ? e.message : 'Retry failed') }
    finally { setRetrying(false) }
  }

  if (loading) return (
    <div className="flex-center" style={{ minHeight: '60vh', flexDirection: 'column', gap: 16 }}>
      <span className="spinner" style={{ width: 32, height: 32 }} />
      <span style={{ color: 'var(--text-muted)' }}>Loading job...</span>
    </div>
  )

  if (error) return (
    <div className="page-body">
      <div className="alert alert-error"><AlertTriangle size={16} /> {error}</div>
      <Link href="/dashboard" className="btn btn-secondary"><ArrowLeft size={16} /> Back to Dashboard</Link>
    </div>
  )

  if (!job) return null

  const isLocked    = job.status === 'finalized'
  const canFinalize = job.status === 'completed'
  const canRetry    = job.status === 'failed' && job.retry_count < 3
  const hasData     = !!job.extracted_data

  return (
    <>
      {}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <Link href="/dashboard" style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}>
              <ArrowLeft size={14} /> Dashboard
            </Link>
            <span style={{ color: 'var(--border-dark)' }}>/</span>
            <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Job Detail</span>
          </div>
          <h1 className="page-title" style={{ fontSize: 20 }}>{job.filename}</h1>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <StatusBadge status={job.status} />
          {canRetry && (
            <button className="btn btn-danger btn-sm" onClick={handleRetry} disabled={retrying}>
              {retrying ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Retrying...</> : <><RotateCcw size={14} /> Retry</>}
            </button>
          )}
          {canFinalize && (
            <button className="btn btn-primary" onClick={handleFinalize} disabled={finalizing}>
              {finalizing ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Finalizing...</> : <><Lock size={14} /> Finalize</>}
            </button>
          )}
        </div>
      </div>

      <div className="page-body">
        {actionErr && <div className="alert alert-error"><AlertTriangle size={16} /> {actionErr}</div>}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
          {}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

            {}
            <div className="card animate-fadeinup">
              <div className="card-header">
                <span className="card-title"><ClipboardList size={18} /> Job Details</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-muted)' }}>{job.id}</span>
              </div>
              <div className="card-body">
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                  {[
                    { label: 'File Size',  value: formatFileSize(job.file_size) },
                    { label: 'File Type',  value: job.file_type.toUpperCase() },
                    { label: 'Created',    value: formatDate(job.created_at) },
                    { label: 'Updated',    value: formatDate(job.updated_at) },
                    { label: 'Retries',    value: `${job.retry_count} / 3` },
                    { label: 'Celery ID',  value: job.celery_task_id?.slice(0,16) + '...' || '—' },
                  ].map(m => (
                    <div key={m.label}>
                      <div className="form-label" style={{ marginBottom: 4 }}>{m.label}</div>
                      <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-secondary)' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {}
            {hasData && (
              <div className="card animate-fadeinup" style={{ animationDelay: '80ms' }}>
                <div className="card-header">
                  <span className="card-title"><PenTool size={18} /> Extracted Data</span>
                  {isLocked && <span className="badge badge-finalized"><span className="badge-dot" />Finalized</span>}
                </div>
                <div className="card-body">
                  <ReviewEditor
                    jobId={id}
                    data={job.extracted_data as ExtractedData}
                    locked={isLocked}
                    onSaved={() => {}}
                  />
                </div>
              </div>
            )}

            {}
            {job.status === 'failed' && job.error_message && (
              <div className="card animate-fadeinup" style={{ borderColor: '#FFD0D0', animationDelay: '120ms' }}>
                <div className="card-header" style={{ background: 'var(--status-failed-bg)' }}>
                  <span className="card-title" style={{ color: 'var(--status-failed)' }}><AlertTriangle size={18} /> Processing Error</span>
                </div>
                <div className="card-body">
                  <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--status-failed)', whiteSpace: 'pre-wrap' }}>
                    {job.error_message}
                  </pre>
                </div>
              </div>
            )}

            {}
            <div className="card animate-fadeinup" style={{ animationDelay: '160ms' }}>
              <div className="card-header">
                <span className="card-title"><Download size={18} /> Export</span>
              </div>
              <div className="card-body">
                <ExportButtons jobId={id} disabled={!isLocked} />
              </div>
            </div>
          </div>

          {}
          <div className="card animate-fadeinup" style={{ animationDelay: '40ms', position: 'sticky', top: 96 }}>
            <div className="card-header" style={{ gap: 8 }}>
              <span className="card-title"><Activity size={18} /> Live Progress</span>
              {sseEnabled && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 500, color: connected ? 'var(--green-dark)' : 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: connected ? 'var(--green-primary)' : 'var(--border-dark)', display: 'inline-block', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
                  {connected ? 'Live' : 'Connecting...'}
                </span>
              )}
            </div>
            <div className="card-body">
              <ProgressTracker
                currentStage={job.current_stage}
                events={events}
                status={job.status}
              />
              {events.length > 0 && (
                <div style={{ marginTop: 20, borderTop: '1px solid var(--border)', paddingTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 }}>
                    Event Log
                  </div>
                  <div style={{ maxHeight: 160, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[...events].reverse().map((ev, i) => (
                      <div key={i} style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', padding: '4px 0', borderBottom: '1px dashed var(--border)', display: 'flex', gap: 8 }}>
                        <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>{new Date(ev.timestamp).toLocaleTimeString()}</span>
                        <span>{ev.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}