'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--status-rejected-bg)', border: '1px solid var(--status-rejected-text)' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--status-rejected-text)' }}>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M12 7v5.5M12 15.5v.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Bir şeyler ters gitti
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Beklenmedik bir hata oluştu. Sayfayı yenilemek sorunu çözebilir.
          </p>
        </div>

        <div className="flex gap-2 w-full">
          <button
            onClick={reset}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--teal)' }}
          >
            Sayfayı Yenile
          </button>
          <a
            href="/dashboard"
            className="flex-1 py-2.5 rounded-xl text-sm font-medium text-center transition-colors"
            style={{ border: '1px solid var(--border-strong)', color: 'var(--text-secondary)' }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'var(--bg-raised)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = 'transparent' }}
          >
            Dashboard
          </a>
        </div>
      </div>
    </div>
  )
}
