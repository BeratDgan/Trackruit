'use client'

import { useRef, useState } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Application, ApplicationStatus } from '@/lib/types'

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string
    accent: string
    dot: string
    bg: string
    text: string
    pillBg: string
    emptyIcon: string
  }
> = {
  wishlist:  { label: 'İstek Listesi', accent: '#94A3B8', dot: '#94A3B8', bg: 'var(--status-wishlist-bg)',  text: 'var(--status-wishlist-text)',  pillBg: 'var(--status-wishlist-bg)',  emptyIcon: '✦' },
  applied:   { label: 'Başvuruldu',    accent: '#60A5FA', dot: '#60A5FA', bg: 'var(--status-applied-bg)',   text: 'var(--status-applied-text)',   pillBg: 'var(--status-applied-bg)',   emptyIcon: '↗' },
  interview: { label: 'Mülakat',       accent: '#FBBF24', dot: '#FBBF24', bg: 'var(--status-interview-bg)', text: 'var(--status-interview-text)', pillBg: 'var(--status-interview-bg)', emptyIcon: '◎' },
  offered:   { label: 'Teklif Alındı', accent: '#34D399', dot: '#34D399', bg: 'var(--status-offered-bg)',   text: 'var(--status-offered-text)',   pillBg: 'var(--status-offered-bg)',   emptyIcon: '★' },
  rejected:  { label: 'Reddedildi',    accent: '#F87171', dot: '#F87171', bg: 'var(--status-rejected-bg)',  text: 'var(--status-rejected-text)',  pillBg: 'var(--status-rejected-bg)',  emptyIcon: '×' },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function formatSalary(salary: number | null | undefined, period: string | null | undefined) {
  if (!salary) return null
  const fmt = salary >= 1000 ? `${(salary / 1000).toFixed(salary % 1000 === 0 ? 0 : 1)}K` : String(salary)
  return `₺${fmt}${period === 'monthly' ? '/ay' : '/yıl'}`
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
}

// ── Deadline badge ─────────────────────────────────────────────────────────

type BadgeStyle = { label: string; color: string; bg: string; dotColor: string }

function deadlineBadge(deadline: string | null | undefined): BadgeStyle | null {
  if (!deadline) return null
  const diff = Math.ceil((new Date(deadline).setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000)
  if (diff < 0)  return { label: 'Süresi Doldu', color: 'var(--text-muted)',              bg: 'var(--bg-raised)',           dotColor: 'var(--text-muted)' }
  if (diff < 3)  return { label: `${diff}g kaldı`, color: 'var(--status-rejected-text)',  bg: 'var(--status-rejected-bg)',  dotColor: 'var(--status-rejected-text)' }
  if (diff <= 7) return { label: `${diff}g kaldı`, color: 'var(--status-interview-text)', bg: 'var(--status-interview-bg)', dotColor: 'var(--status-interview-text)' }
  return           { label: `${diff}g kaldı`, color: 'var(--status-offered-text)',  bg: 'var(--status-offered-bg)',  dotColor: 'var(--status-offered-text)' }
}

function interviewBadge(interviewDate: string | null | undefined): string | null {
  if (!interviewDate) return null
  return new Date(interviewDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

// ── Draggable Card ──────────────────────────────────────────────────────────

export function KanbanCard({
  application: app,
  onEdit,
  onDeleted,
  isOverlay = false,
}: {
  application: Application
  onEdit?: () => void
  onDeleted?: () => void
  isOverlay?: boolean
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: app.id })
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const cfg = STATUS_CONFIG[app.status]
  // Track pointer start position to distinguish click from drag
  const pointerStart = useRef<{ x: number; y: number } | null>(null)

  const deadline  = app.status === 'wishlist' ? deadlineBadge(app.deadline) : null
  const interview = interviewBadge(app.interview_date)
  const salary    = formatSalary(app.salary, app.salary_period)
  const hasBadges = !isOverlay && (!!deadline || !!interview || !!app.location)

  async function handleDelete() {
    setDeleting(true)
    try {
      await fetch(`/api/applications/${app.id}`, { method: 'DELETE' })
      onDeleted?.()
    } finally {
      setDeleting(false)
      setConfirmDelete(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className="group relative flex flex-col gap-2.5 p-3.5 rounded-xl cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cfg.accent}`,
        position: 'relative',
        opacity: isDragging ? 0.5 : deleting ? 0 : 1,
        boxShadow: isOverlay
          ? '0 16px 40px rgba(11,34,64,0.16), 0 4px 12px rgba(11,34,64,0.08)'
          : '0 1px 3px rgba(11,34,64,0.04)',
        transform: isOverlay ? 'rotate(2deg) scale(1.03)' : undefined,
        transition: isDragging ? 'none' : 'box-shadow 0.15s ease, opacity 0.25s ease, transform 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!isDragging && !isOverlay) {
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(11,34,64,0.14), 0 2px 6px rgba(11,34,64,0.08)'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }
      }}
      onMouseLeave={e => {
        if (!isOverlay) {
          e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,34,64,0.04)'
          e.currentTarget.style.transform = 'none'
        }
      }}
      onPointerDown={e => { pointerStart.current = { x: e.clientX, y: e.clientY } }}
      onClick={e => {
        if (isOverlay || !onEdit || !pointerStart.current) return
        const dx = Math.abs(e.clientX - pointerStart.current.x)
        const dy = Math.abs(e.clientY - pointerStart.current.y)
        if (dx < 5 && dy < 5) onEdit()
      }}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
    >
      {/* Delete confirmation overlay */}
      {confirmDelete && !isOverlay && (
        <div
          className="absolute inset-0 rounded-xl flex flex-col items-center justify-center gap-2.5 p-4"
          style={{ background: 'var(--bg-card)', zIndex: 2 }}
          onPointerDown={e => e.stopPropagation()}
          onClick={e => e.stopPropagation()}
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'var(--status-rejected-bg)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" style={{ color: 'var(--status-rejected-text)' }}>
              <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1m1.5 0l-.6 8a1 1 0 01-1 .93H5.1a1 1 0 01-1-.93l-.6-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>
              Bu başvuruyu silmek istediğinizden emin misiniz?
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Bu işlem geri alınamaz.
            </p>
          </div>
          <div className="flex gap-1.5 w-full">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium"
              style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            >
              İptal
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--status-rejected-text)' }}
            >
              {deleting ? '…' : 'Sil'}
            </button>
          </div>
        </div>
      )}

      {/* Top row: avatar + text + actions */}
      <div className="flex items-start gap-2.5">
        <div
          className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{ background: cfg.bg, color: cfg.text, letterSpacing: '-0.02em' }}
        >
          {initials(app.company)}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold leading-tight truncate" style={{ color: 'var(--text-primary)' }} title={app.company}>
            {app.company}
          </p>
          <p className="text-xs leading-tight mt-0.5 truncate" style={{ color: 'var(--text-secondary)' }} title={app.position}>
            {app.position}
          </p>
        </div>

        {!isOverlay && (
          <div
            className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={onEdit}
              className="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-applied-bg)'; e.currentTarget.style.color = 'var(--status-applied-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="Düzenle"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M9.5 1.5l3 3L4 13H1v-3L9.5 1.5z" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button
              onClick={() => setConfirmDelete(true)}
              className="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--status-rejected-bg)'; e.currentTarget.style.color = 'var(--status-rejected-text)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-muted)' }}
              title="Sil"
            >
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1m1.5 0l-.6 8a1 1 0 01-1 .93H5.1a1 1 0 01-1-.93l-.6-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Badges row */}
      {hasBadges && (
        <div className="flex flex-wrap gap-1.5">
          {app.location && !isOverlay && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
              style={{ background: 'var(--bg-raised)', color: 'var(--text-muted)', fontSize: '10px' }}
            >
              <svg width="7" height="7" viewBox="0 0 10 12" fill="none">
                <path d="M5 1a3.5 3.5 0 013.5 3.5C8.5 7.5 5 11 5 11S1.5 7.5 1.5 4.5A3.5 3.5 0 015 1z" stroke="currentColor" strokeWidth="1.2"/>
                <circle cx="5" cy="4.5" r="1" fill="currentColor"/>
              </svg>
              {app.location}
            </span>
          )}
          {deadline && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
              style={{ background: deadline.bg, color: deadline.color, fontSize: '10px', letterSpacing: '0.01em' }}
            >
              {/* clock icon */}
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M6 3.5V6l1.5 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {deadline.label}
            </span>
          )}
          {interview && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-medium"
              style={{ background: 'var(--status-interview-bg)', color: 'var(--status-interview-text)', fontSize: '10px', letterSpacing: '0.01em' }}
            >
              {/* calendar icon */}
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <rect x="1" y="2.5" width="10" height="8.5" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M1 5.5h10M4 1v3M8 1v3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
              {interview}
            </span>
          )}
        </div>
      )}

      {/* Bottom row: date + salary + link */}
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          {formatDate(app.created_at)}
        </span>
        {salary && !isOverlay && (
          <span style={{ color: 'var(--status-offered-text)', fontSize: '10px', fontWeight: 500 }}>
            {salary}
          </span>
        )}
        {app.url && !isOverlay && (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 transition-colors"
            style={{ color: 'var(--text-muted)', fontSize: '10px' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
          >
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
              <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7M8 1h3m0 0v3m0-3L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            İlan
          </a>
        )}
      </div>
    </div>
  )
}

// ── Column ──────────────────────────────────────────────────────────────────

export function KanbanColumn({
  status,
  applications,
  onEdit,
  onDeleted,
  onAdd,
}: {
  status: ApplicationStatus
  applications: Application[]
  onEdit: (app: Application) => void
  onDeleted: (id: string) => void
  onAdd?: () => void
}) {
  const cfg = STATUS_CONFIG[status]
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-2xl overflow-hidden"
      style={{
        width: 256,
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        boxShadow: '0 1px 4px rgba(11,34,64,0.04)',
      }}
    >
      {/* Accent strip */}
      <div style={{ height: 3, background: cfg.accent }} />

      {/* Column header */}
      <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <span className="text-xs font-semibold" style={{ color: cfg.text, letterSpacing: '-0.01em' }}>
          {cfg.label}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: cfg.pillBg, color: cfg.text }}>
            {applications.length}
          </span>
          {onAdd && (
            <button
              onClick={onAdd}
              className="h-5 w-5 rounded-md flex items-center justify-center transition-opacity hover:opacity-60"
              style={{ background: cfg.pillBg, color: cfg.text }}
              title="Yeni Başvuru"
            >
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className="flex flex-col gap-2 flex-1 p-2.5 transition-colors duration-150"
        style={{ background: isOver ? cfg.bg : 'transparent', minHeight: 120 }}
      >
        {applications.map(app => (
          <KanbanCard
            key={app.id}
            application={app}
            onEdit={() => onEdit(app)}
            onDeleted={() => onDeleted(app.id)}
          />
        ))}

        {applications.length === 0 && (
          <div
            className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl transition-colors duration-150"
            style={{
              border: `1.5px dashed ${isOver ? cfg.accent : 'var(--border)'}`,
              background: isOver ? cfg.bg : 'transparent',
            }}
          >
            <span
              className="text-xl select-none"
              style={{ color: isOver ? cfg.accent : 'var(--border)', lineHeight: 1 }}
            >
              {cfg.emptyIcon}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px', textAlign: 'center', lineHeight: 1.5 }}>
              {isOver ? 'Buraya bırak' : 'Henüz başvuru yok'}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
