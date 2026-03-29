'use client'

import { useState } from 'react'
import { useDroppable, useDraggable } from '@dnd-kit/core'
import type { Application, ApplicationStatus } from '@/lib/types'

export const STATUS_CONFIG: Record<
  ApplicationStatus,
  {
    label: string
    accent: string
    dot: string
    bg: string      // CSS var — drop zone tint
    text: string    // CSS var — text/icon color
    pillBg: string  // CSS var — count pill background
    emptyIcon: string
  }
> = {
  wishlist:  {
    label: 'İstek Listesi',
    accent: '#94A3B8',
    dot: '#94A3B8',
    bg: 'var(--status-wishlist-bg)',
    text: 'var(--status-wishlist-text)',
    pillBg: 'var(--status-wishlist-bg)',
    emptyIcon: '✦',
  },
  applied:   {
    label: 'Başvuruldu',
    accent: '#60A5FA',
    dot: '#60A5FA',
    bg: 'var(--status-applied-bg)',
    text: 'var(--status-applied-text)',
    pillBg: 'var(--status-applied-bg)',
    emptyIcon: '↗',
  },
  interview: {
    label: 'Mülakat',
    accent: '#FBBF24',
    dot: '#FBBF24',
    bg: 'var(--status-interview-bg)',
    text: 'var(--status-interview-text)',
    pillBg: 'var(--status-interview-bg)',
    emptyIcon: '◎',
  },
  offered:   {
    label: 'Teklif Alındı',
    accent: '#34D399',
    dot: '#34D399',
    bg: 'var(--status-offered-bg)',
    text: 'var(--status-offered-text)',
    pillBg: 'var(--status-offered-bg)',
    emptyIcon: '★',
  },
  rejected:  {
    label: 'Reddedildi',
    accent: '#F87171',
    dot: '#F87171',
    bg: 'var(--status-rejected-bg)',
    text: 'var(--status-rejected-text)',
    pillBg: 'var(--status-rejected-bg)',
    emptyIcon: '×',
  },
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function initials(name: string) {
  return name.trim().slice(0, 2).toUpperCase()
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
      className="group relative flex flex-col gap-3 p-3.5 rounded-xl cursor-grab active:cursor-grabbing select-none"
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border)',
        borderLeft: `3px solid ${cfg.accent}`,
        opacity: isDragging ? 0 : deleting ? 0.4 : 1,
        boxShadow: isOverlay
          ? '0 16px 40px rgba(11,34,64,0.16), 0 4px 12px rgba(11,34,64,0.08)'
          : '0 1px 3px rgba(11,34,64,0.04)',
        transform: isOverlay ? 'rotate(2deg) scale(1.02)' : undefined,
        transition: isDragging ? 'none' : 'box-shadow 0.15s ease, border-color 0.15s ease',
      }}
      onMouseEnter={e => {
        if (!isDragging && !isOverlay)
          (e.currentTarget.style.boxShadow = '0 4px 12px rgba(11,34,64,0.09), 0 1px 3px rgba(11,34,64,0.05)')
      }}
      onMouseLeave={e => {
        if (!isOverlay)
          (e.currentTarget.style.boxShadow = '0 1px 3px rgba(11,34,64,0.04)')
      }}
      {...(isOverlay ? {} : { ...attributes, ...listeners })}
    >
      {/* Top row: avatar + text */}
      <div className="flex items-start gap-2.5">
        {/* Company initial */}
        <div
          className="flex-shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-xs font-bold"
          style={{
            background: cfg.bg,
            color: cfg.text,
            letterSpacing: '-0.02em',
          }}
        >
          {initials(app.company)}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-xs font-semibold leading-tight truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {app.company}
          </p>
          <p
            className="text-xs leading-tight mt-0.5 truncate"
            style={{ color: 'var(--text-secondary)' }}
          >
            {app.position}
          </p>
        </div>

        {/* Actions — visible on hover, isolated from drag */}
        {!isOverlay && (
          <div
            className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-150"
            onPointerDown={e => e.stopPropagation()}
          >
            {!confirmDelete ? (
              <>
                <button
                  onClick={onEdit}
                  className="h-6 w-6 rounded-md flex items-center justify-center transition-colors"
                  style={{ color: 'var(--text-muted)' }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--status-applied-bg)'
                    e.currentTarget.style.color = 'var(--status-applied-text)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
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
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'var(--status-rejected-bg)'
                    e.currentTarget.style.color = 'var(--status-rejected-text)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = 'var(--text-muted)'
                  }}
                  title="Sil"
                >
                  <svg width="10" height="10" viewBox="0 0 14 14" fill="none">
                    <path d="M1 3.5h12M5 3.5V2.5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5v1m1.5 0l-.6 8a1 1 0 01-1 .93H5.1a1 1 0 01-1-.93l-.6-8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="px-2 py-0.5 rounded text-white font-medium disabled:opacity-50"
                  style={{ background: 'var(--status-rejected-text)', fontSize: '10px' }}
                >
                  {deleting ? '...' : 'Sil'}
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-0.5 rounded font-medium"
                  style={{ border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '10px' }}
                >
                  İptal
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom row: date + link */}
      <div className="flex items-center justify-between">
        <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>
          {formatDate(app.created_at)}
        </span>
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
      <div
        className="flex items-center justify-between px-3.5 py-3"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-semibold tracking-wide"
            style={{ color: cfg.text, letterSpacing: '-0.01em' }}
          >
            {cfg.label}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: cfg.pillBg, color: cfg.text }}
          >
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
        style={{
          background: isOver ? cfg.bg : 'transparent',
          minHeight: 120,
        }}
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
            className="flex flex-col items-center justify-center gap-1.5 py-8 rounded-xl transition-colors duration-150"
            style={{
              border: `1.5px dashed ${isOver ? cfg.accent : 'var(--border)'}`,
              background: isOver ? cfg.bg : 'transparent',
            }}
          >
            <span
              className="text-lg font-light select-none"
              style={{ color: isOver ? cfg.accent : 'var(--border)', lineHeight: 1 }}
            >
              {cfg.emptyIcon}
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '10px' }}>Buraya sürükle</span>
          </div>
        )}
      </div>
    </div>
  )
}
