'use client'
import { useEffect, useRef, useState } from 'react'
import { ProgressEvent } from '@/lib/api'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const TERMINAL_STAGES = new Set(['job_completed', 'job_failed'])

export function useSSE(jobId: string, enabled: boolean) {
  const [events, setEvents]       = useState<ProgressEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [done, setDone]           = useState(false)
  const sourceRef = useRef<EventSource | null>(null)

  useEffect(() => {
    if (!enabled || !jobId || done) return

    const url = `${API_BASE}/jobs/${jobId}/progress`
    const es  = new EventSource(url)
    sourceRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const event: ProgressEvent = JSON.parse(e.data)

        if (event.status === 'connected') return

        setEvents(prev => {

          const exists = prev.some(p => p.stage === event.stage && p.timestamp === event.timestamp)
          if (exists) return prev
          return [...prev, event]
        })

        if (TERMINAL_STAGES.has(event.stage)) {
          setDone(true)
          es.close()
        }
      } catch {  }
    }

    es.onerror = () => {
      setConnected(false)
      es.close()
    }

    return () => {
      es.close()
      setConnected(false)
    }
  }, [jobId, enabled, done])

  return { events, connected, done }
}