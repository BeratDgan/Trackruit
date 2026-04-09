import Link from 'next/link'
import Image from 'next/image'

export default function NotFound() {
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
          top: '35%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '500px',
          height: '300px',
          background: 'radial-gradient(ellipse, rgba(10,166,150,0.05) 0%, transparent 70%)',
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

        {/* 404 visual */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <span
              className="font-bold select-none"
              style={{
                fontSize: '96px',
                lineHeight: 1,
                letterSpacing: '-0.06em',
                color: 'var(--bg-card)',
                WebkitTextStroke: '2px var(--border-strong)',
              }}
            >
              404
            </span>
            {/* Floating badge */}
            <div
              className="absolute -top-3 -right-4 px-2.5 py-1 rounded-lg text-xs font-semibold"
              style={{
                background: 'var(--status-applied-bg)',
                border: '1px solid rgba(96,165,250,0.2)',
                color: 'var(--status-applied-text)',
                transform: 'rotate(6deg)',
              }}
            >
              Reddedildi
            </div>
          </div>

          <div>
            <h1
              className="text-2xl font-semibold"
              style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
            >
              Bu iş ilanı dolmuş
            </h1>
            <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>
              Aradığın sayfa mevcut değil ya da taşınmış olabilir. Başvurularına geri dönelim.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--teal)' }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M6 1L1 7l5 6M1 7h12" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Dashboard&apos;a Dön
          </Link>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            veya{' '}
            <Link href="/dashboard/analytics" style={{ color: 'var(--teal)', textDecoration: 'underline' }}>
              analitiğe git
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
