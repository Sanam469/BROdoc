import { getToken, clearToken } from './auth'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1'

export interface Job {
  id: string
  filename: string
  file_size: number
  file_type: string
  status: 'queued' | 'processing' | 'completed' | 'failed' | 'finalized'
  current_stage: string | null
  retry_count: number
  created_at: string
  updated_at: string
  extracted_data?: ExtractedData | null
  error_message?: string | null
  finalized_at?: string | null
  celery_task_id?: string | null
}

export interface ExtractedData {
  title: string
  category: string
  summary: string
  keywords: string[]
  status: string
}

export interface JobsResponse {
  items: Job[]
  total: number
  page: number
  per_page: number
  total_pages: number
}

export interface UploadResponse {
  job_id: string
  filename: string
  status: string
  message: string
}

export interface ProgressEvent {
  job_id: string
  stage: string
  status: string
  message: string
  timestamp: string
}

function authHeaders(): Record<string, string> {
  const token = getToken()
  if (token) return { Authorization: `Bearer ${token}` }
  return {}
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...authHeaders(), ...options?.headers },
    ...options,
  })
  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  if (res.status === 204) return null as any;
  return res.json()
}

export async function uploadDocuments(files: File[]): Promise<UploadResponse[]> {
  const form = new FormData()
  files.forEach(f => form.append('files', f))
  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: form,
    headers: { ...authHeaders() },
  })
  if (!res.ok) {
    if (res.status === 401) {
      clearToken()
      window.location.href = '/login'
      throw new Error('Session expired')
    }
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || `Upload failed`)
  }
  return res.json()
}

export interface ListJobsParams {
  search?: string
  status?: string
  sort_by?: string
  order?: string
  page?: number
  per_page?: number
}

export async function listJobs(params: ListJobsParams = {}): Promise<JobsResponse> {
  const q = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)))
  return request<JobsResponse>(`/jobs?${q}`)
}

export async function getJob(id: string): Promise<Job> {
  return request<Job>(`/jobs/${id}`)
}

export async function updateReview(
  id: string,
  data: Partial<ExtractedData>
): Promise<Job> {
  return request<Job>(`/jobs/${id}/review`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function finalizeJob(id: string): Promise<Job> {
  return request<Job>(`/jobs/${id}/finalize`, { method: 'POST' })
}

export async function retryJob(id: string): Promise<Job> {
  return request<Job>(`/jobs/${id}/retry`, { method: 'POST' })
}

export async function deleteJob(id: string): Promise<void> {
  return request<void>(`/jobs/${id}`, { method: 'DELETE' })
}

export async function exportJob(id: string, format: 'json' | 'csv'): Promise<void> {
  const res = await fetch(`${API_BASE}/jobs/${id}/export?format=${format}`, {
    headers: { ...authHeaders() },
  })
  if (!res.ok) throw new Error(`Export failed`)
  const blob = await res.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `brodoc_job_${id}.${format}`
  a.click()
  URL.revokeObjectURL(url)
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatRelative(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1)   return 'just now'
  if (mins < 60)  return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24)   return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export const STAGE_LABELS: Record<string, string> = {
  job_queued:                   'Job Queued',
  job_started:                  'Job Started',
  document_parsing_started:     'Parsing Document',
  document_parsing_completed:   'Parsing Complete',
  field_extraction_started:     'Extracting Fields',
  field_extraction_completed:   'Extraction Complete',
  job_completed:                'Job Completed',
  job_failed:                   'Job Failed',
}