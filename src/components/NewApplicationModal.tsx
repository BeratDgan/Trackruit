'use client'

import { useEffect, useRef, useState } from 'react'
import type { Application, ApplicationStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist',  label: 'İstek Listesi' },
  { value: 'applied',  label: 'Başvuruldu' },
  { value: 'interview', label: 'Mülakat' },
  { value: 'offered',  label: 'Teklif Alındı' },
  { value: 'rejected', label: 'Reddedildi' },
]

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (app: Application) => void
  onUpdated: (app: Application) => void
  editingApp?: Application
}

export default function ApplicationModal({ open, onClose, onCreated, onUpdated, editingApp }: Props) {
  const isEdit = !!editingApp

  const [company, setCompany]   = useState('')
  const [position, setPosition] = useState('')
  const [status, setStatus]     = useState<ApplicationStatus>('applied')
  const [url, setUrl]           = useState('')
  const [notes, setNotes]       = useState('')
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const firstInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (editingApp) {
        setCompany(editingApp.company)
        setPosition(editingApp.position)
        setStatus(editingApp.status)
        setUrl(editingApp.url ?? '')
        setNotes(editingApp.notes ?? '')
      } else {
        setCompany(''); setPosition(''); setStatus('applied'); setUrl(''); setNotes('')
      }
      setError(null)
      setTimeout(() => firstInput.current?.focus(), 50)
    }
  }, [open, editingApp])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!company.trim() || !position.trim()) return
    setLoading(true)
    setError(null)

    const body = {
      company: company.trim(),
      position: position.trim(),
      status,
      url: url.trim() || null,
      notes: notes.trim() || null,
    }

    try {
      if (isEdit) {
        const res = await fetch(`/api/applications/${editingApp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Başvuru güncellenemedi')
        const app: Application = await res.json()
        onUpdated(app)
      } else {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Başvuru eklenemedi')
        const app: Application = await res.json()
        onCreated(app)
      }
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Bir hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop"
      style={{ background: 'rgba(11,34,64,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-md rounded-2xl animate-modal"
        style={{ background: 'var(--card)', boxShadow: '0 24px 64px rgba(0,0,0,0.18)' }}
      >
        <div className="flex items-center justify-between px-6 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isEdit ? 'Başvuruyu Düzenle' : 'Yeni Başvuru'}
          </h2>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Şirket *">
              <input ref={firstInput} value={company} onChange={e => setCompany(e.target.value)} placeholder="Google, Meta..." required className="input-base" />
            </Field>
            <Field label="Pozisyon *">
              <input value={position} onChange={e => setPosition(e.target.value)} placeholder="Software Engineer" required className="input-base" />
            </Field>
          </div>

          <Field label="Durum">
            <select value={status} onChange={e => setStatus(e.target.value as ApplicationStatus)} className="input-base">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>

          <Field label="İlan Linki">
            <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="input-base" />
          </Field>

          <Field label="Notlar">
            <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Mülakat tarihi, recruiter adı..." rows={3} className="input-base resize-none" />
          </Field>

          {error && (
            <p className="text-sm px-3 py-2 rounded-lg" style={{ background: '#FEF2F2', color: '#DC2626' }}>{error}</p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ border: '1.5px solid var(--border)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              İptal
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--navy)' }}
            >
              {loading ? (isEdit ? 'Kaydediliyor...' : 'Ekleniyor...') : (isEdit ? 'Kaydet' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>

      <style jsx>{`
        .input-base {
          width: 100%;
          padding: 0.5rem 0.75rem;
          border-radius: 0.625rem;
          font-size: 0.875rem;
          border: 1.5px solid var(--border);
          color: var(--text-primary);
          background: white;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .input-base::placeholder { color: var(--text-muted); }
      `}</style>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{label}</label>
      {children}
    </div>
  )
}
