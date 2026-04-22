'use client'
import { ProgressEvent, STAGE_LABELS } from '@/lib/api'
import { Check, X, Clock } from 'lucide-react'

const STAGES = [
  'job_queued',
  'job_started',
  'document_parsing_started',
  'document_parsing_completed',
  'field_extraction_started',
  'field_extraction_completed',
  'job_completed',
]

interface Props {
  currentStage: string | null
  events: ProgressEvent[]
  status: string
}

export default function ProgressTracker({ currentStage, events, status }: Props) {
  const stageIndex = STAGES.indexOf(currentStage || 'job_queued')
  const failed = status === 'failed'

  const getStageState = (stage: string, idx: number) => {
    if (failed && stage === 'job_completed') return 'failed'
    if (idx < stageIndex || status === 'completed' || status === 'finalized') return 'done'
    if (stage === currentStage) return 'active'
    return 'pending'
  }

  const getEventMessage = (stage: string): string | null => {
    const ev = [...events].reverse().find(e => e.stage === stage)
    return ev?.message || null
  }

  const getEventTime = (stage: string): string | null => {
    const ev = [...events].reverse().find(e => e.stage === stage)
    if (!ev) return null
    return new Date(ev.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  }

  return (
    <div className="progress-track">
      {STAGES.map((stage, idx) => {
        const state = getStageState(stage, idx)
        const msg = getEventMessage(stage)
        const time = getEventTime(stage)

        return (
          <div key={stage} className={`stage-item ${state !== 'pending' ? state : ''}`}>
            {}
            <div className={`stage-dot ${state}`}>
              {state === 'done'    && <Check size={14} strokeWidth={3} />}
              {state === 'active'  && <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
              {state === 'failed'  && <X size={14} strokeWidth={3} />}
              {state === 'pending' && <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700 }}>{idx + 1}</span>}
            </div>

            {}
            <div className="stage-content">
              <div className="stage-name" style={{
                color: state === 'done'   ? 'var(--green-dark)'
                     : state === 'active' ? 'var(--blue-accent)'
                     : state === 'failed' ? 'var(--status-failed)'
                     : 'var(--text-muted)',
              }}>
                {STAGE_LABELS[stage] || stage}
              </div>
              {msg  && <div className="stage-message">{msg}</div>}
              {time && <div className="stage-time" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10} /> {time}</div>}
            </div>
          </div>
        )
      })}

      {}
      {failed && (
        <div className="stage-item">
          <div className="stage-dot failed"><X size={14} strokeWidth={3} /></div>
          <div className="stage-content">
            <div className="stage-name" style={{ color: 'var(--status-failed)' }}>Job Failed</div>
            <div className="stage-message">Processing encountered an error. Use Retry to reprocess.</div>
          </div>
        </div>
      )}
    </div>
  )
}