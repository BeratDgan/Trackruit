'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core'
import type { Application, ApplicationStatus } from '@/lib/types'
import { KanbanColumn, KanbanCard, STATUS_CONFIG } from './KanbanColumn'
import ImportModal from '@/components/ImportModal'
import { useToast } from '@/components/Toast'

const COLUMNS: ApplicationStatus[] = ['wishlist', 'applied', 'interview', 'offered', 'rejected']

// ── Skeleton components ────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div
      className="rounded-xl p-3.5 animate-pulse"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderLeft: '3px solid var(--border)' }}
    >
      <div className="flex items-start gap-2.5">
        <div className="h-7 w-7 rounded-lg flex-shrink-0" style={{ background: 'var(--border)' }} />
        <div className="flex-1 flex flex-col gap-2">
          <div className="h-2.5 w-3/4 rounded" style={{ background: 'var(--border)' }} />
          <div className="h-2 w-1/2 rounded" style={{ background: 'var(--border)' }} />
        </div>
      </div>
      <div className="mt-3 h-2 w-1/3 rounded" style={{ background: 'var(--border)' }} />
    </div>
  )
}

function SkeletonColumn({ accent }: { accent: string }) {
  return (
    <div
      className="flex flex-col flex-shrink-0 rounded-2xl overflow-hidden"
      style={{ width: 256, border: '1px solid var(--border)', background: 'var(--bg-card)' }}
    >
      <div style={{ height: 3, background: accent, opacity: 0.3 }} />
      <div className="flex items-center justify-between px-3.5 py-3" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-5 w-6 rounded-full animate-pulse" style={{ background: 'var(--border)' }} />
      </div>
      <div className="flex flex-col gap-2 p-2.5">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  )
}

// ── Board ──────────────────────────────────────────────────────────────────────

export default function KanbanBoard({
  applications,
  onStatusChange,
  onEdit,
  onDeleted,
  onAdd,
  onImported,
  loading = false,
}: {
  applications: Application[]
  onStatusChange: (id: string, newStatus: ApplicationStatus, prevStatus: ApplicationStatus) => void
  onEdit: (app: Application) => void
  onDeleted: (id: string) => void
  onAdd?: () => void
  onImported?: (apps: Application[]) => void
  loading?: boolean
}) {
  const { toast } = useToast()
  const [activeApp, setActiveApp]           = useState<Application | null>(null)
  const [errorMsg, setErrorMsg]             = useState<string | null>(null)
  const [query, setQuery]                   = useState('')
  const [locationFilter, setLocationFilter] = useState('all')
  const [importOpen, setImportOpen]         = useState(false)

  // Auto-dismiss error toast
  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(null), 3500)
    return () => clearTimeout(t)
  }, [errorMsg])

  // Unique locations derived from data
  const locations = useMemo(() => {
    const locs = applications.map(a => a.location).filter(Boolean) as string[]
    return Array.from(new Set(locs)).sort()
  }, [applications])

  // Client-side filtering (AND logic)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return applications.filter(a => {
      const matchQuery = !q || a.company.toLowerCase().includes(q) || a.position.toLowerCase().includes(q)
      const matchLoc   = locationFilter === 'all' || a.location === locationFilter
      return matchQuery && matchLoc
    })
  }, [applications, query, locationFilter])

  const isFiltering = query.trim() !== '' || locationFilter !== 'all'

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor,   { activationConstraint: { delay: 200, tolerance: 5 } })
  )

  function handleDragStart(event: DragStartEvent) {
    const app = applications.find(a => a.id === event.active.id)
    setActiveApp(app ?? null)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveApp(null)
    if (!over) return

    const newStatus = over.id as ApplicationStatus
    const app = applications.find(a => a.id === active.id)
    if (!app || app.status === newStatus) return

    onStatusChange(app.id, newStatus, app.status)

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
      const cfg = STATUS_CONFIG[newStatus]
      toast(`${app.company} → ${cfg.label}`)
    } catch {
      onStatusChange(app.id, app.status, newStatus)
      setErrorMsg('Durum güncellenemedi. Lütfen tekrar dene.')
    }
  }

  const byStatus = (s: ApplicationStatus) => filtered.filter(a => a.status === s)

  // ── Skeleton ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 260px)' }}>
        {COLUMNS.map(status => (
          <SkeletonColumn key={status} accent={STATUS_CONFIG[status].accent} />
        ))}
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* ── Filter bar ────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4 flex-wrap sm:flex-nowrap">

        {/* Search */}
        <div className="relative flex-1 min-w-0" style={{ minWidth: 180 }}>
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="13" height="13" viewBox="0 0 14 14" fill="none"
            style={{ color: 'var(--text-muted)' }}
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Şirket veya pozisyon ara…"
            className="input-base"
            style={{ paddingLeft: '2rem', height: 36, fontSize: '12px' }}
          />
        </div>

        {/* Location filter */}
        <div className="relative flex-shrink-0" style={{ width: 160 }}>
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="11" height="11" viewBox="0 0 12 12" fill="none"
            style={{ color: 'var(--text-muted)' }}
          >
            <path d="M6 1a3.5 3.5 0 013.5 3.5C9.5 7.5 6 11 6 11S2.5 7.5 2.5 4.5A3.5 3.5 0 016 1z" stroke="currentColor" strokeWidth="1.2"/>
            <circle cx="6" cy="4.5" r="1" fill="currentColor"/>
          </svg>
          <select
            value={locationFilter}
            onChange={e => setLocationFilter(e.target.value)}
            className="input-base"
            style={{ paddingLeft: '1.75rem', height: 36, fontSize: '12px', appearance: 'none' }}
          >
            <option value="all">Tüm Konumlar</option>
            {locations.map(loc => (
              <option key={loc} value={loc}>{loc}</option>
            ))}
          </select>
          {/* Chevron */}
          <svg
            className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            width="10" height="10" viewBox="0 0 10 10" fill="none"
            style={{ color: 'var(--text-muted)' }}
          >
            <path d="M2.5 3.5L5 6.5l2.5-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Clear filters */}
        {isFiltering && (
          <button
            onClick={() => { setQuery(''); setLocationFilter('all') }}
            className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
            style={{
              height: 36,
              border: '1px solid var(--border-strong)',
              color: 'var(--text-secondary)',
              background: 'transparent',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-raised)'; e.currentTarget.style.color = 'var(--text-primary)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
            </svg>
            Temizle
          </button>
        )}

        {/* Results count when filtering */}
        {isFiltering && (
          <span className="flex-shrink-0 text-xs" style={{ color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
            {filtered.length} sonuç
          </span>
        )}

        {/* Import button */}
        <button
          onClick={() => setImportOpen(true)}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 rounded-lg text-xs font-medium transition-colors"
          style={{
            height: 36,
            border: '1px solid var(--border-strong)',
            color: 'var(--text-secondary)',
            background: 'transparent',
            whiteSpace: 'nowrap',
            marginLeft: 'auto',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-glow)'; e.currentTarget.style.borderColor = 'var(--teal)'; e.currentTarget.style.color = 'var(--teal)' }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'var(--border-strong)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
          title="Excel veya CSV'den içe aktar"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v8M4 6l3 3 3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M1 11h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          İçe Aktar
        </button>
      </div>

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onImported={apps => { onImported?.(apps); setImportOpen(false) }}
      />

      {/* ── Filter zero state ────────────────────────────────────────────── */}
      {isFiltering && filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--border-strong)' }}>
            <circle cx="14" cy="14" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M21 21l7 7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            <path d="M10 14h8M14 10v8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
            Arama kriterlerine uygun başvuru bulunamadı
          </p>
          <button
            onClick={() => { setQuery(''); setLocationFilter('all') }}
            className="text-xs px-3 py-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--teal)', border: '1px solid var(--teal)', background: 'transparent' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--teal-glow)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
          >
            Filtreyi Temizle
          </button>
        </div>
      ) : (
        /* ── Columns ──────────────────────────────────────────────────────── */
        <div className="flex gap-3 overflow-x-auto pb-6" style={{ minHeight: 'calc(100vh - 260px)' }}>
          {COLUMNS.map(status => (
            <KanbanColumn
              key={status}
              status={status}
              applications={byStatus(status)}
              onEdit={onEdit}
              onDeleted={onDeleted}
              onAdd={onAdd}
            />
          ))}
        </div>
      )}

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeApp && <KanbanCard application={activeApp} isOverlay />}
      </DragOverlay>

      {/* ── Error toast ───────────────────────────────────────────────────── */}
      {errorMsg && (
        <div
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
          style={{
            background: 'var(--bg-raised)',
            border: '1px solid var(--status-rejected-text)',
            color: 'var(--status-rejected-text)',
            animation: 'fadeSlideUp 0.2s ease',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {errorMsg}
        </div>
      )}
    </DndContext>
  )
}
