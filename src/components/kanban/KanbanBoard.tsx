'use client'

import { useEffect, useState } from 'react'
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
import { KanbanColumn, KanbanCard } from './KanbanColumn'

const COLUMNS: ApplicationStatus[] = ['wishlist', 'applied', 'interview', 'offered', 'rejected']

export default function KanbanBoard({
  applications,
  onStatusChange,
  onEdit,
  onDeleted,
  onAdd,
}: {
  applications: Application[]
  onStatusChange: (id: string, newStatus: ApplicationStatus, prevStatus: ApplicationStatus) => void
  onEdit: (app: Application) => void
  onDeleted: (id: string) => void
  onAdd?: () => void
}) {
  const [activeApp, setActiveApp] = useState<Application | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!errorMsg) return
    const t = setTimeout(() => setErrorMsg(null), 3500)
    return () => clearTimeout(t)
  }, [errorMsg])

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

    // Optimistic — update parent state immediately
    onStatusChange(app.id, newStatus, app.status)

    try {
      const res = await fetch(`/api/applications/${app.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on error
      onStatusChange(app.id, app.status, newStatus)
      setErrorMsg('Durum güncellenemedi. Lütfen tekrar dene.')
    }
  }

  const byStatus = (s: ApplicationStatus) => applications.filter(a => a.status === s)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
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
      <div
        className="flex gap-3 overflow-x-auto pb-6"
        style={{ minHeight: 'calc(100vh - 200px)' }}
      >
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

      <DragOverlay dropAnimation={{ duration: 150, easing: 'cubic-bezier(0.18,0.67,0.6,1.22)' }}>
        {activeApp && <KanbanCard application={activeApp} isOverlay />}
      </DragOverlay>
    </DndContext>
  )
}
