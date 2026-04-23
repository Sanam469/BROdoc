'use client'
import { useEffect, useRef, useState } from 'react'
import { ProgressEvent } from '@/lib/api'
import { getToken } from '@/lib/auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

const TERMINAL_STAGES = new Set(['job_completed', 'job_failed'])

export function useSSE(jobId: string, enabled: boolean) {
  const [events, setEvents]       = useState<ProgressEvent[]>([])
  const [connected, setConnected] = useState(false)
  const [done, setDone]           = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!enabled || !jobId || done) return

    const controller = new AbortController()
    abortRef.current = controller

    async function startStream() {
      const token = getToken()
      if (!token) return

        console.log(`[SSE] 📡 Connecting to stream for Job: ${jobId}...`);
        const res = await fetch(`${API_BASE}/jobs/${jobId}/progress`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })

        if (!res.ok || !res.body) {
          console.error(`[SSE] ❌ Connection failed: ${res.status} ${res.statusText}`);
          setConnected(false)
          return
        }

        console.log(`[SSE] ✅ Connected to stream!`);
        setConnected(true)
        const reader = res.body.getReader()
        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done: readerDone, value } = await reader.read()
          if (readerDone) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event: ProgressEvent = JSON.parse(line.slice(6))
                console.log(`[SSE] 📥 Received Event:`, event);
                
                if (event.status === 'connected') continue

                setEvents(prev => {
                  const exists = prev.some(p => p.stage === event.stage && p.timestamp === event.timestamp)
                  if (exists) return prev
                  return [...prev, event]
                })

                if (TERMINAL_STAGES.has(event.stage)) {
                  setDone(true)
                  reader.cancel()
                  return
                }
              } catch { /* ignore parse errors */ }
            }
          }
        }
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          setConnected(false)
        }
      }
    }

    startStream()

    return () => {
      controller.abort()
      setConnected(false)
    }
  }, [jobId, enabled, done])

  return { events, connected, done }
}