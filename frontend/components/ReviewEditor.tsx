'use client'
import { useState } from 'react'
import { ExtractedData, updateReview } from '@/lib/api'
import { Lock, Save, CheckCircle, AlertTriangle } from 'lucide-react'

interface Props {
  jobId: string
  data: ExtractedData
  locked: boolean          
  onSaved: (d: ExtractedData) => void
}

export default function ReviewEditor({ jobId, data, locked, onSaved }: Props) {
  const [form, setForm]     = useState<ExtractedData>({ ...data })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved]   = useState(false)
  const [error, setError]   = useState<string | null>(null)

  const set = (field: keyof ExtractedData, value: string | string[]) => {
    setForm(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const handleSave = async () => {
    setSaving(true); setError(null)
    try {
      const updated = await updateReview(jobId, {
        title:    form.title,
        category: form.category,
        summary:  form.summary,
        keywords: form.keywords,
      })
      onSaved(updated.extracted_data as ExtractedData)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Save failed')
    } finally { setSaving(false) }
  }

  const keywordsStr = Array.isArray(form.keywords) ? form.keywords.join(', ') : form.keywords

  return (
    <div>
      {locked && (
        <div className="alert alert-info" style={{ marginBottom: 20 }}>
          <Lock size={16} /> This job is finalized. Fields are read-only.
        </div>
      )}

      <div className="form-group">
        <label className="form-label">Title</label>
        <input
          className="input"
          value={form.title}
          disabled={locked}
          onChange={e => set('title', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Category</label>
        <input
          className="input"
          value={form.category}
          disabled={locked}
          onChange={e => set('category', e.target.value)}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Summary</label>
        <textarea
          className="textarea"
          value={form.summary}
          disabled={locked}
          rows={5}
          onChange={e => set('summary', e.target.value)}
          style={{ minHeight: 120 }}
        />
      </div>

      <div className="form-group">
        <label className="form-label">Keywords <span style={{ fontWeight: 400, textTransform: 'none', color: 'var(--text-muted)', fontSize: 12 }}>(comma-separated)</span></label>
        <input
          className="input"
          value={keywordsStr}
          disabled={locked}
          onChange={e => set('keywords', e.target.value.split(',').map(k => k.trim()).filter(Boolean))}
          placeholder="e.g. contract, NDA, legal, 2024"
        />
        {}
        {form.keywords.length > 0 && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
            {form.keywords.map(kw => kw.trim()).filter(Boolean).map(kw => (
              <span key={kw} style={{
                background: 'var(--green-bg)',
                color: 'var(--green-dark)',
                border: '1px solid #C0F2DA',
                borderRadius: 100,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 600,
              }}>{kw}</span>
            ))}
          </div>
        )}
      </div>

      {!locked && (
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 12 }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving
              ? <><span className="spinner" style={{ width: 14, height: 14 }} /> Saving...</>
              : <><Save size={16} /> Save Changes</>
            }
          </button>
          {saved  && <span style={{ color: 'var(--green-dark)', fontSize: 13, fontWeight: 600, animation: 'fadeIn 0.3s ease', display: 'flex', alignItems: 'center', gap: 4 }}><CheckCircle size={16} /> Saved</span>}
          {error  && <span style={{ color: 'var(--status-failed)', fontSize: 13, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={16} /> {error}</span>}
        </div>
      )}
    </div>
  )
}