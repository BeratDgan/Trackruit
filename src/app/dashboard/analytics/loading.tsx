export default function AnalyticsLoading() {
  return (
    <div className="space-y-8">
      {/* Header skeleton */}
      <div className="space-y-2">
        <div className="h-7 w-32 rounded-lg animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="h-4 w-48 rounded animate-pulse" style={{ background: 'var(--border)' }} />
      </div>

      {/* Section label */}
      <div className="flex items-center gap-3">
        <div className="h-3 w-12 rounded animate-pulse" style={{ background: 'var(--border)' }} />
        <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map(i => (
          <div
            key={i}
            className="rounded-2xl p-5 flex flex-col gap-3"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="h-3 w-24 rounded animate-pulse" style={{ background: 'var(--border)' }} />
            <div className="h-8 w-20 rounded animate-pulse" style={{ background: 'var(--border)' }} />
            <div className="h-3 w-32 rounded animate-pulse" style={{ background: 'var(--border)' }} />
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map(i => (
          <div
            key={i}
            className="rounded-2xl p-5"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-3 w-20 rounded animate-pulse" style={{ background: 'var(--border)' }} />
              <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            </div>
            <div className="h-[220px] flex items-end gap-3 px-2">
              {[60, 40, 80, 30, 70].map((h, j) => (
                <div key={j} className="flex-1 rounded-t-lg animate-pulse" style={{ height: `${h}%`, background: 'var(--border)' }} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
