'use client'

import { useState } from 'react'
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
