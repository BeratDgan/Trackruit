'use client'

import { useEffect, useRef, useState } from 'react'
import type { Application, ApplicationStatus } from '@/lib/types'
import ApplicationModal from './NewApplicationModal'
import KanbanBoard from './kanban/KanbanBoard'

const STATUS_CONFIG: Record<ApplicationStatus, { label: string; dot: string; bg: string; text: string }> = {
  wishlist:  { label: 'İstek Listesi', dot: '#94A3B8', bg: 'var(--status-wishlist-bg)',   text: 'var(--status-wishlist-text)' },
  applied:   { label: 'Başvuruldu',    dot: '#60A5FA', bg: 'var(--status-applied-bg)',    text: 'var(--status-applied-text)' },
  interview: { label: 'Mülakat',       dot: '#FBBF24', bg: 'var(--status-interview-bg)',  text: 'var(--status-interview-text)' },
  offered:   { label: 'Teklif Alındı', dot: '#34D399', bg: 'var(--status-offered-bg)',    text: 'var(--status-offered-text)' },
  rejected:  { label: 'Reddedildi',    dot: '#F87171', bg: 'var(--status-rejected-bg)',   text: 'var(--status-rejected-text)' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function formatSalary(salary: number | null | undefined, period: string | null | undefined) {
  if (!salary) return null
  const fmt = salary >= 1000 ? `${(salary / 1000).toFixed(salary % 1000 === 0 ? 0 : 1)}K` : String(salary)
  return `₺${fmt}${period === 'monthly' ? '/ay' : '/yıl'}`
}

export default function ApplicationList({
  initialApplications,
  planType = 'free',
}: {
  initialApplications: Application[]
  planType?: 'free' | 'pro'
}) {
  const FREE_LIMIT = 20
  const [applications, setApplications] = useState(initialApplications)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingApp, setEditingApp]     = useState<Application | undefined>()
  const [view, setView]                 = useState<'list' | 'kanban'>('list')
  const [upgradeOpen, setUpgradeOpen]   = useState(false)

  const atLimit = planType === 'free' && applications.length >= FREE_LIMIT

  function openNew() {
    if (atLimit) { setUpgradeOpen(true); return }
    setEditingApp(undefined); setModalOpen(true)
  }
  function openEdit(app: Application) { setEditingApp(app); setModalOpen(true) }
  function handleClose() { setModalOpen(false); setEditingApp(undefined) }

  function handleCreated(app: Application) { setApplications(prev => [app, ...prev]) }
  function handleLimitError() { setModalOpen(false); setUpgradeOpen(true) }
  function handleUpdated(updated: Application) { setApplications(prev => prev.map(a => a.id === updated.id ? updated : a)) }
  function handleDeleted(id: string)  { setApplications(prev => prev.filter(a => a.id !== id)) }
  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const stats = {
    total:     applications.length,
    applied:   applications.filter(a => a.status === 'applied').length,
    interview: applications.filter(a => a.status === 'interview').length,
    offered:   applications.filter(a => a.status === 'offered').length,
    rejected:  applications.filter(a => a.status === 'rejected').length,
  }

  const modal = (
    <>
      <ApplicationModal
        open={modalOpen}
        onClose={handleClose}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        onLimitError={handleLimitError}
        editingApp={editingApp}
      />
      <UpgradeModal open={upgradeOpen} onClose={() => setUpgradeOpen(false)} />
    </>
  )

  if (view === 'kanban') {
    return (
      <div className="flex flex-col gap-6">
        <Header count={applications.length} view={view} onViewChange={setView} onAdd={openNew} planType={planType} freeLimit={FREE_LIMIT} />
        <KanbanBoard
          applications={applications}
          onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus)}
          onEdit={openEdit}
          onDeleted={handleDeleted}
          onAdd={openNew}
          onImported={apps => setApplications(prev => [...apps, ...prev])}
        />
        {modal}
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <Header count={applications.length} view={view} onViewChange={setView} onAdd={openNew} planType={planType} freeLimit={FREE_LIMIT} />

        {applications.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <StatChip label="Toplam"     value={stats.total}     textColor="var(--text-primary)"          bg="var(--bg-card)" />
            <StatChip label="Başvuruldu" value={stats.applied}   textColor="var(--status-applied-text)"   bg="var(--status-applied-bg)" />
            <StatChip label="Mülakat"    value={stats.interview} textColor="var(--status-interview-text)" bg="var(--status-interview-bg)" />
            <StatChip label="Teklif"     value={stats.offered}   textColor="var(--status-offered-text)"   bg="var(--status-offered-bg)" />
            {stats.rejected > 0 && (
              <StatChip label="Red" value={stats.rejected} textColor="var(--status-rejected-text)" bg="var(--status-rejected-bg)" />
            )}
          </div>
        )}

        {applications.length === 0 ? (
          <EmptyState onAdd={openNew} />
        ) : (
          <div className="flex flex-col gap-2 card-stagger">
            {applications.map(app => (
              <ApplicationCard
                key={app.id}
                application={app}
                onEdit={() => openEdit(app)}
                onDeleted={() => handleDeleted(app.id)}
              />
            ))}
          </div>
        )}
      </div>
      {modal}
    </>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────

function Header({
  count, view, onViewChange, onAdd, planType, freeLimit,
}: {
  count: number
  view: 'list' | 'kanban'
  onViewChange: (v: 'list' | 'kanban') => void
  onAdd: () => void
  planType: 'free' | 'pro'
  freeLimit: number
}) {
  const pct   = Math.min(count / freeLimit, 1)
  const atLim = planType === 'free' && count >= freeLimit

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Başvurularım
        </h1>
        {planType === 'free' ? (
          <div className="flex items-center gap-2 mt-1">
            <div className="w-28 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border-strong)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct * 100}%`, background: atLim ? '#ef4444' : 'var(--teal)' }}
              />
            </div>
            <span className="text-xs" style={{ color: atLim ? '#ef4444' : 'var(--text-muted)' }}>
              {count}/{freeLimit} başvuru
            </span>
          </div>
        ) : (
          <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
            {count === 0 ? 'Henüz başvuru yok' : `${count} başvuru`}
          </p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
        >
          <ViewBtn active={view === 'list'} onClick={() => onViewChange('list')} title="Liste">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </ViewBtn>
          <ViewBtn active={view === 'kanban'} onClick={() => onViewChange('kanban')} title="Kanban">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="6" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </ViewBtn>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Yeni Başvuru
        </button>
      </div>
    </div>
  )
}

function ViewBtn({ active, onClick, title, children }: {
  active: boolean; onClick: () => void; title: string; children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-center h-9 w-9 transition-colors"
      style={{
        background: active ? 'var(--teal)' : 'transparent',
        color: active ? 'white' : 'var(--text-muted)',
      }}
      title={title}
    >
      {children}
    </button>
  )
}

// ── Application card (list view) ──────────────────────────────────────────────

type CLState = 'idle' | 'loading' | 'input' | 'result'

function ApplicationCard({ application: app, onEdit, onDeleted }: {
  application: Application
  onEdit: () => void
  onDeleted: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting]           = useState(false)
  const [clState, setClState]             = useState<CLState>('idle')
  const [coverLetter, setCoverLetter]     = useState('')
  const [jobDesc, setJobDesc]             = useState('')
  const [clError, setClError]             = useState<string | null>(null)
  const [copied, setCopied]               = useState(false)
  const cfg    = STATUS_CONFIG[app.status]
  const salary = formatSalary(app.salary, app.salary_period)

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/applications/${app.id}`, { method: 'DELETE' })
      onDeleted()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  async function requestCoverLetter(jobDescription?: string) {
    setClState('loading')
    setClError(null)
    try {
      const res = await fetch('/api/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: app.id, jobDescription }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Bir hata oluştu')
      if (data.needsManualInput) { setClState('input'); return }
      setCoverLetter(data.coverLetter)
      setClState('result')
    } catch (err) {
      setClError(err instanceof Error ? err.message : 'Bir hata oluştu')
      setClState('idle')
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(coverLetter).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const displayDate = app.applied_date
    ? `Başv. ${formatDate(app.applied_date)}`
    : formatDate(app.created_at)

  return (
    <>
      <div
        className="group flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all"
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border)',
          opacity: deleting ? 0.5 : 1,
        }}
        onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(10,166,150,0.25)')}
        onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
      >
        {/* Status dot */}
        <div className="h-2 w-2 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

        {/* Company + position + location */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
            {app.company}
          </p>
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>
            {app.position}
          </p>
          {app.location && (
            <p className="text-xs truncate mt-0.5 flex items-center gap-1" style={{ color: 'var(--text-muted)' }}>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 016 1z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="6" cy="4.5" r="1" fill="currentColor"/>
              </svg>
              {app.location}
            </p>
          )}
        </div>

        {/* Salary */}
        {salary && (
          <span className="flex-shrink-0 text-xs font-medium hidden md:block" style={{ color: 'var(--status-offered-text)' }}>
            {salary}
          </span>
        )}

        {/* Status badge */}
        <span
          className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium hidden sm:block"
          style={{ background: cfg.bg, color: cfg.text }}
        >
          {cfg.label}
        </span>

        {/* URL */}
        {app.url && (
          <a
            href={app.url} target="_blank" rel="noopener noreferrer"
            className="flex-shrink-0 hidden md:flex items-center gap-1 text-xs transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            onClick={e => e.stopPropagation()}
          >
            <svg width="11" height="11" viewBox="0 0 12 12" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            İlan
          </a>
        )}

        {/* Date */}
        <span className="flex-shrink-0 text-xs hidden sm:block" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {displayDate}
        </span>

        {/* Actions */}
        {confirmDelete ? (
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>Silinsin mi?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2.5 py-1 rounded-lg text-xs font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--status-rejected-text)' }}
            >
              {deleting ? '…' : 'Evet'}
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
            >
              Hayır
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            {/* Cover Letter */}
            <button
              onClick={() => requestCoverLetter()}
              disabled={clState === 'loading'}
              className="h-7 w-7 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-glow)'; e.currentTarget.style.color = 'var(--teal)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="Ön Yazı Oluştur"
            >
              {clState === 'loading' ? (
                <svg className="animate-spin" width="11" height="11" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.3"/>
                  <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                  <rect x="1" y="1" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M4 4h6M4 7h6M4 10h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              )}
            </button>

            {/* Edit */}
            <button
              onClick={onEdit}
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-applied-bg)'; e.currentTarget.style.color = 'var(--status-applied-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="Düzenle"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Delete */}
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-7 w-7 rounded-lg flex items-center justify-center"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-rejected-bg)'; e.currentTarget.style.color = 'var(--status-rejected-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="Sil"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1m1.5 0l-.6 8a1 1 0 01-1 .93H5.1a1 1 0 01-1-.93l-.6-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Error toast */}
      {clError && (
        <p className="text-xs px-3 py-2 rounded-lg -mt-1" style={{ background: 'var(--status-rejected-bg)', color: 'var(--status-rejected-text)' }}>
          {clError}
        </p>
      )}

      {/* ── Job description input modal ── */}
      {clState === 'input' && (
        <CLModal onClose={() => setClState('idle')} title="İlan Metnini Yapıştır">
          <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
            İlan linki otomatik okunamadı. İş ilanı metnini aşağıya yapıştır.
          </p>
          <textarea
            className="input-base resize-none"
            rows={8}
            value={jobDesc}
            onChange={e => setJobDesc(e.target.value)}
            placeholder="İş ilanı içeriğini buraya yapıştır..."
            autoFocus
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => setClState('idle')}
              className="flex-1 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1.5px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              İptal
            </button>
            <button
              onClick={() => { setJobDesc(''); requestCoverLetter(jobDesc) }}
              disabled={!jobDesc.trim()}
              className="flex-1 py-2 rounded-xl text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--teal)' }}
            >
              Oluştur
            </button>
          </div>
        </CLModal>
      )}

      {/* ── Result modal ── */}
      {clState === 'result' && (
        <CLModal onClose={() => setClState('idle')} title={`Ön Yazı — ${app.company}`} wide>
          <textarea
            className="input-base resize-none font-mono"
            rows={14}
            value={coverLetter}
            onChange={e => setCoverLetter(e.target.value)}
            style={{ fontSize: '12px', lineHeight: '1.6' }}
          />
          <div className="flex gap-2 mt-4">
            <button
              onClick={() => requestCoverLetter()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1.5px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="11" height="11" viewBox="0 0 14 14" fill="none">
                <path d="M1 7A6 6 0 1112.5 4M13 1v4H9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Yenile
            </button>
            <div className="flex-1" />
            <button
              onClick={() => setClState('idle')}
              className="px-4 py-2 rounded-xl text-sm font-medium"
              style={{ border: '1.5px solid var(--border-strong)', color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              Kapat
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium text-white transition-all"
              style={{ background: copied ? '#22c55e' : 'var(--teal)' }}
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Kopyalandı
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="white" strokeWidth="1.2"/>
                    <path d="M4 8H3a1 1 0 01-1-1V3a1 1 0 011-1h4a1 1 0 011 1v1" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                  Kopyala
                </>
              )}
            </button>
          </div>
        </CLModal>
      )}
    </>
  )
}

// ── Cover letter modal shell ──────────────────────────────────────────────────

function CLModal({ children, onClose, title, wide }: {
  children: React.ReactNode
  onClose: () => void
  title: string
  wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop"
      style={{ background: 'var(--bg-overlay)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div
        ref={ref}
        className="w-full animate-modal"
        style={{
          maxWidth: wide ? 640 : 480,
          background: 'var(--bg-card)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
        }}
      >
        <div className="flex items-center justify-between px-6 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ background: 'var(--teal-glow)', border: '1px solid var(--teal)' }}>
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="1" width="12" height="12" rx="2" stroke="var(--teal)" strokeWidth="1.3"/>
                <path d="M4 4h6M4 7h6M4 10h3" stroke="var(--teal)" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            </div>
            <h2 className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)', maxWidth: 320 }}>{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="h-7 w-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round"/>
            </svg>
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}

// ── Stat chip ─────────────────────────────────────────────────────────────────

function StatChip({ label, value, textColor, bg }: {
  label: string; value: number; textColor: string; bg: string
}) {
  return (
    <div
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl"
      style={{ background: bg, border: '1px solid var(--border)' }}
    >
      <span className="text-base font-semibold" style={{ color: textColor, lineHeight: 1 }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ── Empty state ───────────────────────────────────────────────────────────────

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 rounded-2xl"
      style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-card)' }}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center mb-4"
        style={{ background: 'var(--bg-raised)' }}
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6M12 9v6M3 12a9 9 0 1018 0A9 9 0 003 12z" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Henüz başvuru yok</p>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>İlk başvurunı ekleyerek takibe başla</p>
      <button
        onClick={onAdd}
        className="px-4 py-2 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--teal)' }}
      >
        Başvuru Ekle
      </button>
    </div>
  )
}

// ── Upgrade modal ─────────────────────────────────────────────────────────────

function UpgradeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl p-8 flex flex-col items-center text-center gap-4 shadow-2xl"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex items-center justify-center w-7 h-7 rounded-lg transition-colors"
          style={{ color: 'var(--text-muted)', background: 'transparent' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M1 1l10 10M11 1L1 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>

        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)' }}
        >
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ color: '#fbbf24' }}>
            <path d="M12 2l2.9 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l7.1-1.01L12 2z"
              stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/>
          </svg>
        </div>

        <div>
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Ücretsiz Plan Limitine Ulaştın
          </h2>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)' }}>
            Ücretsiz planda en fazla <strong style={{ color: 'var(--text-secondary)' }}>20 başvuru</strong> ekleyebilirsin.
            Sınırsız takip için Pro plana geç.
          </p>
        </div>

        <div className="w-full flex flex-col gap-2 mt-1">
          <button
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'linear-gradient(135deg, #14b8a6, #0ea5e9)' }}
          >
            Pro&apos;ya Geç — Sınırsız Başvuru
          </button>
          <button
            onClick={onClose}
            className="w-full py-2 rounded-xl text-sm transition-colors"
            style={{ color: 'var(--text-muted)', background: 'transparent' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)' }}
          >
            Şimdilik kalsın
          </button>
        </div>
      </div>
    </div>
  )
}
