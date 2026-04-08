'use client'

import { useEffect, useState } from 'react'

const TIMEOUT_MS = 8000

export default function DashboardLoading() {
  const [timedOut, setTimedOut] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), TIMEOUT_MS)
    return () => clearTimeout(t)
  }, [])

  if (timedOut) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-text)' }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--status-rejected-text)' }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 7v5.5M12 15.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Yükleme zaman aşımına uğradı
          </p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Veriler 8 saniye içinde gelmedi. Bağlantını kontrol et.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M1 7A6 6 0 1112.5 4M13 1v4H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Sayfayı Yenile
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header skeleton */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2">
          <div className="h-6 w-36 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-4 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-9 w-20 rounded-xl animate-pulse" style={{ background: 'var(--border)' }} />
          <div className="h-9 w-32 rounded-xl animate-pulse" style={{ background: 'var(--teal)', opacity: 0.2 }} />
        </div>
      </div>

      {/* Stat chips */}
      <div className="flex gap-2">
        {[48, 64, 56, 52, 44].map((w, i) => (
          <div
            key={i}
            className="h-7 rounded-lg animate-pulse"
            style={{ width: w, background: 'var(--border)' }}
          />
        ))}
      </div>

      {/* Application rows */}
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div
            key={i}
            className="flex items-center gap-4 px-5 py-3.5 rounded-xl"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            {/* Status dot */}
            <div className="h-2 w-2 rounded-full flex-shrink-0 animate-pulse" style={{ background: 'var(--border-strong)' }} />
            {/* Name block */}
            <div className="flex-1 flex flex-col gap-1.5 min-w-0">
              <div
                className="h-3.5 rounded animate-pulse"
                style={{ width: `${[55, 70, 45, 60, 50, 65][i - 1]}%`, background: 'var(--border-strong)' }}
              />
              <div
                className="h-3 rounded animate-pulse"
                style={{ width: `${[40, 55, 35, 48, 38, 52][i - 1]}%`, background: 'var(--border)' }}
              />
            </div>
            {/* Status badge */}
            <div className="h-6 w-20 rounded-lg flex-shrink-0 animate-pulse hidden sm:block" style={{ background: 'var(--border)' }} />
            {/* Date */}
            <div className="h-3 w-16 rounded animate-pulse flex-shrink-0 hidden sm:block" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
