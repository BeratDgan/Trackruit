export default function Loading() {
  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* Spinner */}
        <svg
          className="animate-spin"
          width="32"
          height="32"
          viewBox="0 0 32 32"
          fill="none"
          style={{ color: 'var(--teal)' }}
        >
          <circle cx="16" cy="16" r="13" stroke="currentColor" strokeWidth="2.5" opacity="0.2"/>
          <path
            d="M16 3a13 13 0 0113 13"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </svg>
        <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
          Yükleniyor…
        </span>
      </div>
    </div>
  )
}
