'use client'

import { createContext, useCallback, useContext, useRef, useState } from 'react'

type ToastType = 'success' | 'error'

interface ToastItem {
  id: number
  message: string
  type: ToastType
  exiting?: boolean
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

let _id = 0

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

  const dismiss = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id))
    timers.current.delete(id)
  }, [])

  const toast = useCallback((message: string, type: ToastType = 'success') => {
    const id = ++_id
    const duration = type === 'error' ? 5000 : 3000
    setToasts(prev => [...prev, { id, message, type }])
    const t = setTimeout(() => dismiss(id), duration)
    timers.current.set(id, t)
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}

      {/* Toast portal — bottom-right */}
      <div
        className="fixed bottom-5 right-5 z-[999] flex flex-col gap-2 items-end"
        style={{ pointerEvents: 'none' }}
      >
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl"
            style={{
              background: 'var(--bg-raised)',
              border: `1px solid ${t.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
              color: t.type === 'success' ? '#22c55e' : '#ef4444',
              animation: 'fadeSlideUp 0.2s ease',
              pointerEvents: 'auto',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              maxWidth: 320,
            }}
          >
            {t.type === 'success' ? (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4.5 7l2 2 3-3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
              </svg>
            )}
            <span style={{ color: 'var(--text-primary)' }}>{t.message}</span>
            <button
              onClick={() => dismiss(t.id)}
              className="ml-1 flex-shrink-0"
              style={{ color: 'var(--text-muted)', lineHeight: 1 }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
