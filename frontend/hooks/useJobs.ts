'use client'
import { useEffect, useState, useCallback } from 'react'
import { Job, getJob } from '@/lib/api'

export function useJob(jobId: string, pollWhileProcessing = true) {
  const [job, setJob]         = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)

  const fetch = useCallback(async () => {
    try {
      const j = await getJob(jobId)
      setJob(j)
      setError(null)
    } catch (e: any) {
      setError(e.message)
    } finally { setLoading(false) }
  }, [jobId])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    if (!pollWhileProcessing) return
    if (!job) return
    if (job.status === 'completed' || job.status === 'failed' || job.status === 'finalized') return

    const id = setInterval(fetch, 3000)
    return () => clearInterval(id)
  }, [job, pollWhileProcessing, fetch])

  return { job, loading, error, refetch: fetch }
}