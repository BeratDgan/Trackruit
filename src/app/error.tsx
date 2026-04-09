'use client'

import { useEffect } from 'react'
import Image from 'next/image'

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
      className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden"
      style={{ background: 'var(--bg-base)' }}
    >
      {/* Background decoration */}
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)
          `,
          backgroundSize: '56px 56px',
        }}
      />
      <div
        aria-hidden
        className="absolute pointer-events-none"
        style={{
          top: '30%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(239,68,68,0.06) 0%, transparent 70%)',
        }}
      />

      <div className="relative flex flex-col items-center gap-7 text-center max-w-md">
        {/* Logo */}
        <Image
          src="/logo/trackruit-on-dark.png"
          alt="Trackruit"
          width={1782}
          height={470}
          style={{ height: 22, width: 'auto', opacity: 0.5 }}
        />

        {/* Error icon */}
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center"
            style={{
              background: 'var(--status-rejected-bg)',
              border: '1px solid rgba(248,113,113,0.25)',
              boxShadow: '0 0 40px rgba(239,68,68,0.08)',
            }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--status-rejected-text)' }}>
              <path d="M12 9v4M12 17h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>

          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Bir şeyler ters gitti
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '320px' }}>
              Beklenmedik bir hata oluştu. Endişelenme — başvurularına bir şey olmadı.
              Sayfayı yenilemek sorunu çözebilir.
            </p>
            {error.digest && (
              <p className="text-xs mt-3 font-mono px-3 py-1.5 rounded-lg inline-block"
                style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}
              >
                Hata kodu: {error.digest}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2.5 w-full max-w-xs">
          <button
            onClick={reset}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--teal)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M1 7A6 6 0 1112.5 4M13 1v4H9" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Tekrar Dene
          </button>
          <a
            href="/dashboard"
            className="flex-1 flex items-center justify-center py-2.5 rounded-xl text-sm font-medium transition-colors"
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
