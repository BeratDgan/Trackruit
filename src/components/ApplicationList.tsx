'use client'

import { useState } from 'react'
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

export default function ApplicationList({ initialApplications }: { initialApplications: Application[] }) {
  const [applications, setApplications] = useState(initialApplications)
  const [modalOpen, setModalOpen]       = useState(false)
  const [editingApp, setEditingApp]     = useState<Application | undefined>()
  const [view, setView]                 = useState<'list' | 'kanban'>('list')

  function openNew() { setEditingApp(undefined); setModalOpen(true) }
  function openEdit(app: Application) { setEditingApp(app); setModalOpen(true) }
  function handleClose() { setModalOpen(false); setEditingApp(undefined) }

  function handleCreated(app: Application) {
    setApplications(prev => [app, ...prev])
  }

  function handleUpdated(updated: Application) {
    setApplications(prev => prev.map(a => a.id === updated.id ? updated : a))
  }

  function handleDeleted(id: string) {
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  function handleStatusChange(id: string, newStatus: ApplicationStatus) {
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a))
  }

  const stats = {
    total: applications.length,
    interview: applications.filter(a => a.status === 'interview').length,
    offered: applications.filter(a => a.status === 'offered').length,
  }

  if (view === 'kanban') {
    return (
      <div className="flex flex-col gap-6">
        <Header
          count={applications.length}
          view={view}
          onViewChange={setView}
          onAdd={openNew}
        />
        <KanbanBoard
          applications={applications}
          onStatusChange={(id, newStatus) => handleStatusChange(id, newStatus)}
          onEdit={openEdit}
          onDeleted={handleDeleted}
          onAdd={openNew}
        />
        <ApplicationModal
          open={modalOpen}
          onClose={handleClose}
          onCreated={handleCreated}
          onUpdated={handleUpdated}
          editingApp={editingApp}
        />
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col gap-6">
        <Header
          count={applications.length}
          view={view}
          onViewChange={setView}
          onAdd={openNew}
        />

        {applications.length > 0 && (
          <div className="flex gap-3">
            <StatChip label="Toplam"  value={stats.total}     color="var(--text-primary)" />
            <StatChip label="Mülakat" value={stats.interview} color="#B45309" />
            <StatChip label="Teklif"  value={stats.offered}   color="#065F46" />
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

      <ApplicationModal
        open={modalOpen}
        onClose={handleClose}
        onCreated={handleCreated}
        onUpdated={handleUpdated}
        editingApp={editingApp}
      />
    </>
  )
}

function Header({
  count,
  view,
  onViewChange,
  onAdd,
}: {
  count: number
  view: 'list' | 'kanban'
  onViewChange: (v: 'list' | 'kanban') => void
  onAdd: () => void
}) {
  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
          Başvurularım
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          {count === 0 ? 'Henüz başvuru yok' : `${count} başvuru`}
        </p>
      </div>
      <div className="flex items-center gap-2">
        {/* View toggle */}
        <div
          className="flex items-center rounded-xl overflow-hidden"
          style={{ border: '1px solid var(--border-strong)', background: 'var(--bg-card)' }}
        >
          <button
            onClick={() => onViewChange('list')}
            className="flex items-center justify-center h-9 w-9 transition-colors"
            style={{
              background: view === 'list' ? 'var(--teal)' : 'transparent',
              color: view === 'list' ? 'white' : 'var(--text-muted)',
            }}
            title="Liste görünümü"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            onClick={() => onViewChange('kanban')}
            className="flex items-center justify-center h-9 w-9 transition-colors"
            style={{
              background: view === 'kanban' ? 'var(--teal)' : 'transparent',
              color: view === 'kanban' ? 'white' : 'var(--text-muted)',
            }}
            title="Kanban görünümü"
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="6" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.5"/>
              <rect x="11" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            </svg>
          </button>
        </div>

        <button
          onClick={onAdd}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Yeni Başvuru
        </button>
      </div>
    </div>
  )
}

function ApplicationCard({ application: app, onEdit, onDeleted }: {
  application: Application
  onEdit: () => void
  onDeleted: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cfg = STATUS_CONFIG[app.status]

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

  return (
    <div
      className="group flex items-center gap-4 px-5 py-4 rounded-xl transition-all"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        opacity: deleting ? 0.5 : 1,
      }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(10,166,150,0.25)')}
      onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}
    >
      <div className="h-2.5 w-2.5 rounded-full flex-shrink-0" style={{ background: cfg.dot }} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{app.company}</p>
        <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-secondary)' }}>{app.position}</p>
      </div>

      <span
        className="flex-shrink-0 px-2.5 py-1 rounded-lg text-xs font-medium hidden sm:block"
        style={{ background: cfg.bg, color: cfg.text }}
      >
        {cfg.label}
      </span>

      {app.url && (
        <a
          href={app.url} target="_blank" rel="noopener noreferrer"
          className="flex-shrink-0 hidden md:flex items-center gap-1 text-xs"
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

      <span className="flex-shrink-0 text-xs hidden sm:block" style={{ color: 'var(--text-muted)' }}>
        {formatDate(app.created_at)}
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
            {deleting ? '...' : 'Evet'}
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
          {/* Edit */}
          <button
            onClick={onEdit}
            className="h-7 w-7 rounded-lg flex items-center justify-center"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => {
              (e.currentTarget.style.background = 'var(--status-applied-bg)')
              ;(e.currentTarget.style.color = 'var(--status-applied-text)')
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = 'transparent')
              ;(e.currentTarget.style.color = 'var(--text-muted)')
            }}
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
            onMouseEnter={e => {
              (e.currentTarget.style.background = 'var(--status-rejected-bg)')
              ;(e.currentTarget.style.color = 'var(--status-rejected-text)')
            }}
            onMouseLeave={e => {
              (e.currentTarget.style.background = 'transparent')
              ;(e.currentTarget.style.color = 'var(--text-muted)')
            }}
            title="Sil"
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1m1.5 0l-.6 8a1 1 0 01-1 .93H5.1a1 1 0 01-1-.93l-.6-8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  )
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <span className="text-lg font-semibold" style={{ color, lineHeight: 1 }}>{value}</span>
      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 rounded-2xl" style={{ border: '1.5px dashed var(--border-strong)', background: 'var(--bg-card)' }}>
      <div className="h-12 w-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'var(--surface)' }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M9 12h6M12 9v6M3 12a9 9 0 1018 0A9 9 0 003 12z" stroke="var(--teal)" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </div>
      <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Henüz başvuru yok</p>
      <p className="text-xs mt-1 mb-5" style={{ color: 'var(--text-muted)' }}>İlk başvurunı ekleyerek takibe başla</p>
      <button onClick={onAdd} className="px-4 py-2 rounded-xl text-sm font-medium text-white" style={{ background: 'var(--navy)' }}>
        Başvuru Ekle
      </button>
    </div>
  )
}
