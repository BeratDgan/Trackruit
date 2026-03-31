'use client'

import { useEffect, useRef, useState } from 'react'
import type { Application, ApplicationStatus } from '@/lib/types'

const STATUS_OPTIONS: { value: ApplicationStatus; label: string }[] = [
  { value: 'wishlist',   label: 'İstek Listesi' },
  { value: 'applied',   label: 'Başvuruldu' },
  { value: 'interview', label: 'Mülakat' },
  { value: 'offered',   label: 'Teklif Alındı' },
  { value: 'rejected',  label: 'Reddedildi' },
]

function today() {
  return new Date().toISOString().split('T')[0]
}

function formatDisplayDate(iso: string) {
  // Add noon time to avoid timezone-off-by-one
  return new Date(iso + 'T12:00:00').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })
}

// ── Custom date input ────────────────────────────────────────────────────────

function DateInput({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const ref = useRef<HTMLInputElement>(null)

  function openPicker() {
    if (!ref.current) return
    try { (ref.current as HTMLInputElement & { showPicker?: () => void }).showPicker?.() }
    catch { ref.current.focus() }
  }

  return (
    <div
      className="input-base flex items-center justify-between gap-2"
      style={{ cursor: 'pointer', position: 'relative', userSelect: 'none' }}
      onClick={openPicker}
    >
      <span style={{ flex: 1, fontSize: '0.875rem', color: value ? 'var(--text-primary)' : 'var(--text-muted)' }}>
        {value ? formatDisplayDate(value) : (placeholder ?? 'Tarih seç')}
      </span>

      <div className="flex items-center gap-2 flex-shrink-0">
        {value && (
          <span
            className="flex items-center justify-center h-4 w-4 rounded text-xs transition-colors"
            style={{ color: 'var(--text-muted)', position: 'relative', zIndex: 1 }}
            onClick={e => { e.stopPropagation(); onChange('') }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--status-rejected-text)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            title="Temizle"
          >
            <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </span>
        )}
        <svg width="13" height="13" viewBox="0 0 12 12" fill="none" style={{ color: 'var(--text-muted)' }}>
          <rect x="1" y="2.5" width="10" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.2"/>
          <path d="M1 5.5h10M4 1v3M8 1v3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      </div>

      {/* Invisible native input — opens the system date picker */}
      <input
        ref={ref}
        type="date"
        value={value}
        onChange={e => onChange(e.target.value)}
        tabIndex={-1}
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0,
          cursor: 'pointer',
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
        }}
      />
    </div>
  )
}

// ── Section label ─────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 -mb-1">
      <span
        className="text-xs font-semibold uppercase"
        style={{ color: 'var(--text-muted)', letterSpacing: '0.07em' }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )
}

// ── Modal ─────────────────────────────────────────────────────────────────────

interface Props {
  open: boolean
  onClose: () => void
  onCreated: (app: Application) => void
  onUpdated: (app: Application) => void
  editingApp?: Application
}

export default function ApplicationModal({ open, onClose, onCreated, onUpdated, editingApp }: Props) {
  const isEdit = !!editingApp

  const [company, setCompany]             = useState('')
  const [position, setPosition]           = useState('')
  const [status, setStatus]               = useState<ApplicationStatus>('applied')
  const [url, setUrl]                     = useState('')
  const [notes, setNotes]                 = useState('')
  const [salary, setSalary]               = useState('')
  const [salaryPeriod, setSalaryPeriod]   = useState<'monthly' | 'yearly'>('monthly')
  const [location, setLocation]           = useState('')
  const [deadline, setDeadline]           = useState('')
  const [appliedDate, setAppliedDate]     = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const firstInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (open) {
      if (editingApp) {
        setCompany(editingApp.company)
        setPosition(editingApp.position)
        setStatus(editingApp.status)
        setUrl(editingApp.url ?? '')
        setNotes(editingApp.notes ?? '')
        setSalary(editingApp.salary != null ? String(editingApp.salary) : '')
        setSalaryPeriod(editingApp.salary_period ?? 'monthly')
        setLocation(editingApp.location ?? '')
        setDeadline(editingApp.deadline ?? '')
        setAppliedDate(editingApp.applied_date ?? '')
        setInterviewDate(editingApp.interview_date ?? '')
      } else {
        setCompany(''); setPosition(''); setStatus('applied'); setUrl(''); setNotes('')
        setSalary(''); setSalaryPeriod('monthly'); setLocation('')
        setDeadline(''); setAppliedDate(today()); setInterviewDate('')
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

  function handleStatusChange(next: ApplicationStatus) {
    const prev = status
    setStatus(next)
    if (next === 'applied' && prev !== 'applied' && !appliedDate) {
      setAppliedDate(today())
    }
  }

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
      salary: salary ? Number(salary) : null,
      salary_period: salary ? salaryPeriod : null,
      location: location.trim() || null,
      deadline: deadline || null,
      applied_date: appliedDate || null,
      interview_date: status === 'interview' ? (interviewDate || null) : null,
    }

    try {
      if (isEdit) {
        const res = await fetch(`/api/applications/${editingApp.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Başvuru güncellenemedi')
        onUpdated(await res.json())
      } else {
        const res = await fetch('/api/applications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        if (!res.ok) throw new Error('Başvuru eklenemedi')
        onCreated(await res.json())
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
      style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        className="w-full max-w-lg rounded-2xl animate-modal flex flex-col"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
          maxHeight: 'calc(100dvh - 2rem)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 pt-5 pb-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
              {isEdit ? 'Başvuruyu Düzenle' : 'Yeni Başvuru'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {isEdit ? 'Bilgileri güncelleyip kaydet' : 'Yeni bir başvuru takibine başla'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5 overflow-y-auto">

          {/* — Pozisyon ——————————————————————————— */}
          <SectionLabel>Pozisyon</SectionLabel>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Şirket *">
              <input
                ref={firstInput}
                value={company}
                onChange={e => setCompany(e.target.value)}
                placeholder="Google, Meta…"
                required
                className="input-base"
              />
            </Field>
            <Field label="Pozisyon *">
              <input
                value={position}
                onChange={e => setPosition(e.target.value)}
                placeholder="Software Engineer"
                required
                className="input-base"
              />
            </Field>
          </div>

          <Field label="Durum">
            <select
              value={status}
              onChange={e => handleStatusChange(e.target.value as ApplicationStatus)}
              className="input-base"
            >
              {STATUS_OPTIONS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          {/* — Detaylar ——————————————————————————— */}
          <SectionLabel>Detaylar</SectionLabel>

          {/* Salary */}
          <Field label="Maaş">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <span
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-sm pointer-events-none"
                  style={{ color: 'var(--text-muted)' }}
                >
                  ₺
                </span>
                <input
                  type="number"
                  min={0}
                  value={salary}
                  onChange={e => setSalary(e.target.value)}
                  placeholder="85 000"
                  className="input-base"
                  style={{ paddingLeft: '1.75rem' }}
                />
              </div>
              <select
                value={salaryPeriod}
                onChange={e => setSalaryPeriod(e.target.value as 'monthly' | 'yearly')}
                className="input-base"
                style={{ width: 110, flexShrink: 0 }}
              >
                <option value="monthly">/ Aylık</option>
                <option value="yearly">/ Yıllık</option>
              </select>
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Konum">
              <input
                value={location}
                onChange={e => setLocation(e.target.value)}
                placeholder="İstanbul, Remote…"
                className="input-base"
              />
            </Field>
            <Field label="İlan Linki">
              <input
                type="url"
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder="https://…"
                className="input-base"
              />
            </Field>
          </div>

          {/* — Tarihler ——————————————————————————— */}
          <SectionLabel>Tarihler</SectionLabel>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Başvuru Tarihi">
              <DateInput value={appliedDate} onChange={setAppliedDate} placeholder="Tarih seç" />
            </Field>
            <Field label="Son Başvuru Tarihi">
              <DateInput value={deadline} onChange={setDeadline} placeholder="Tarih seç" />
            </Field>
          </div>

          {status === 'interview' && (
            <Field label="Mülakat Tarihi">
              <DateInput value={interviewDate} onChange={setInterviewDate} placeholder="Tarih seç" />
            </Field>
          )}

          {/* — Notlar ———————————————————————————— */}
          <SectionLabel>Notlar</SectionLabel>

          <textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder="Recruiter adı, süreç notları, hatırlatmalar…"
            rows={3}
            className="input-base resize-none"
          />

          {error && (
            <p
              className="text-sm px-3 py-2 rounded-lg"
              style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)' }}
            >
              {error}
            </p>
          )}

          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ border: '1.5px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--teal)' }}
            >
              {loading
                ? (isEdit ? 'Kaydediliyor…' : 'Ekleniyor…')
                : (isEdit ? 'Kaydet' : 'Ekle')}
            </button>
          </div>
        </form>
      </div>
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
