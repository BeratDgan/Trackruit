import Link from 'next/link'

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="flex flex-col items-center gap-5 text-center max-w-sm">
        {/* 404 */}
        <div
          className="px-5 py-2 rounded-xl font-mono text-4xl font-bold tracking-tighter"
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            color: 'var(--teal)',
            letterSpacing: '-0.04em',
          }}
        >
          404
        </div>

        <div>
          <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
            Sayfa bulunamadı
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--text-muted)' }}>
            Aradığın sayfa mevcut değil ya da taşınmış olabilir.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M6 1L1 7l5 6M1 7h12" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Dashboard&apos;a Dön
        </Link>
      </div>
    </div>
  )
}
