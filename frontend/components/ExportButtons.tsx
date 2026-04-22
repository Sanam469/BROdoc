'use client'
import { useState } from 'react'
import { exportJob } from '@/lib/api'
import { FileJson, Table, Lock, AlertTriangle } from 'lucide-react'

interface Props { jobId: string; disabled?: boolean }

export default function ExportButtons({ jobId, disabled }: Props) {
  const [loadingJson, setLoadingJson] = useState(false)
  const [loadingCsv,  setLoadingCsv]  = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleExport = async (format: 'json' | 'csv') => {
    const setLoading = format === 'json' ? setLoadingJson : setLoadingCsv
    setLoading(true); setError(null)
    try {
      await exportJob(jobId, format)
    } catch (e: any) {
      setError(e.message || 'Export failed')
    } finally { setLoading(false) }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button
          className="btn btn-secondary"
          disabled={disabled || loadingJson}
          onClick={() => handleExport('json')}
          title={disabled ? 'Finalize the job first to enable export' : 'Download as JSON'}
        >
          {loadingJson
            ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Exporting...</>
            : <><FileJson size={16} /> Export JSON</>
          }
        </button>

        <button
          className="btn btn-secondary"
          disabled={disabled || loadingCsv}
          onClick={() => handleExport('csv')}
          title={disabled ? 'Finalize the job first to enable export' : 'Download as CSV'}
        >
          {loadingCsv
            ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Exporting...</>
            : <><Table size={16} /> Export CSV</>
          }
        </button>
      </div>

      {disabled && (
        <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Lock size={12} /> Finalize the job to unlock export
        </p>
      )}

      {error && (
        <div className="alert alert-error" style={{ marginTop: 16 }}><AlertTriangle size={16} /> {error}</div>
      )}
    </div>
  )
}