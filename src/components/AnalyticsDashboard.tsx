'use client'

import { useMemo, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid,
} from 'recharts'
import type { Application, ApplicationStatus } from '@/lib/types'

// ── Colour tokens (must be hardcoded for Recharts SVG attributes) ──────────
const STATUS_COLORS: Record<ApplicationStatus, string> = {
  wishlist:  '#6b7280',
  applied:   '#3b82f6',
  interview: '#f59e0b',
  offered:   '#10b981',
  rejected:  '#ef4444',
}
const STATUS_LABELS: Record<ApplicationStatus, string> = {
  wishlist:  'İstek Listesi',
  applied:   'Başvuruldu',
  interview: 'Mülakat',
  offered:   'Teklif',
  rejected:  'Reddedildi',
}
const TEAL = '#14b8a6'

// ── Helpers ────────────────────────────────────────────────────────────────
function isoWeekLabel(dateStr: string): string {
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return ''
  // Monday of that week
  const day  = d.getDay() === 0 ? 7 : d.getDay()
  const mon  = new Date(d)
  mon.setDate(d.getDate() - day + 1)
  return mon.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })
}

function formatSalary(n: number, period: string | null | undefined): string {
  if (n >= 1000) return `₺${(n / 1000).toFixed(0)}K${period === 'yearly' ? '/yıl' : '/ay'}`
  return `₺${n.toLocaleString('tr-TR')}${period === 'yearly' ? '/yıl' : '/ay'}`
}

function daysFromNow(dateStr: string): number {
  const d = new Date(dateStr)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  d.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - now.getTime()) / 86_400_000)
}

// ── Stat card ──────────────────────────────────────────────────────────────
function StatCard({
  label, value, sub, accent,
}: {
  label: string
  value: string | number
  sub?: string
  accent?: string
}) {
  return (
    <div
      className="rounded-2xl p-5 flex flex-col gap-1"
      style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
    >
      <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</span>
      <span
        className="text-3xl font-bold tracking-tight"
        style={{ color: accent ?? 'var(--text-primary)' }}
      >
        {value}
      </span>
      {sub && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</span>}
    </div>
  )
}

// ── Custom tooltip ─────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: {
  active?: boolean; payload?: { value: number; color: string }[]; label?: string
}) {
  if (!active || !payload?.length) return null
  return (
    <div
      className="rounded-xl px-3 py-2 text-xs shadow-lg"
      style={{ background: 'var(--bg-raised)', border: '1px solid var(--border-strong)', color: 'var(--text-primary)' }}
    >
      {label && <div className="font-medium mb-1">{label}</div>}
      {payload.map((p, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full inline-block" style={{ background: p.color }} />
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function AnalyticsDashboard({ applications }: { applications: Application[] }) {
  const [salaryPeriod, setSalaryPeriod] = useState<'monthly' | 'yearly'>('monthly')

  const total = applications.length

  // Status distribution
  const byStatus = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of applications) counts[a.status] = (counts[a.status] ?? 0) + 1
    return (['wishlist', 'applied', 'interview', 'offered', 'rejected'] as ApplicationStatus[]).map(s => ({
      status: s,
      label: STATUS_LABELS[s],
      count: counts[s] ?? 0,
      color: STATUS_COLORS[s],
    }))
  }, [applications])

  // Rates
  const interviewCount = (byStatus.find(b => b.status === 'interview')?.count ?? 0) +
                         (byStatus.find(b => b.status === 'offered')?.count ?? 0)
  const offeredCount   = byStatus.find(b => b.status === 'offered')?.count ?? 0
  const appliedTotal   = applications.filter(a => a.status !== 'wishlist').length

  const interviewRate = appliedTotal > 0 ? Math.round((interviewCount / appliedTotal) * 100) : 0
  const offerRate     = appliedTotal > 0 ? Math.round((offeredCount   / appliedTotal) * 100) : 0

  // Average salary
  const salaryApps = useMemo(
    () => applications.filter(a => a.salary && a.salary > 0),
    [applications],
  )
  const avgSalary = useMemo(() => {
    if (!salaryApps.length) return null
    const converted = salaryApps.map(a => {
      const s = a.salary!
      if (salaryPeriod === 'yearly')  return a.salary_period === 'monthly' ? s * 12 : s
      return a.salary_period === 'yearly' ? Math.round(s / 12) : s
    })
    return Math.round(converted.reduce((a, b) => a + b, 0) / converted.length)
  }, [salaryApps, salaryPeriod])

  // Weekly time series (last 12 weeks)
  const weeklyData = useMemo(() => {
    const weeks: Record<string, number> = {}
    for (const a of applications) {
      const dateStr = a.applied_date ?? a.created_at
      if (!dateStr) continue
      const label = isoWeekLabel(dateStr)
      if (label) weeks[label] = (weeks[label] ?? 0) + 1
    }
    // Keep last 12 weeks sorted
    const sorted = Object.entries(weeks)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .slice(-12)
    return sorted.map(([week, count]) => ({ week, count }))
  }, [applications])

  // Upcoming events (next 7 days)
  const upcoming = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    const in7   = new Date(today); in7.setDate(today.getDate() + 7)
    const events: { date: Date; days: number; type: 'deadline' | 'interview'; app: Application }[] = []

    for (const a of applications) {
      if (a.deadline) {
        const d = new Date(a.deadline); d.setHours(0, 0, 0, 0)
        if (d >= today && d <= in7) events.push({ date: d, days: daysFromNow(a.deadline), type: 'deadline', app: a })
      }
      if (a.interview_date) {
        const d = new Date(a.interview_date); d.setHours(0, 0, 0, 0)
        if (d >= today && d <= in7) events.push({ date: d, days: daysFromNow(a.interview_date), type: 'interview', app: a })
      }
    }
    return events.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [applications])

  const sectionLabel = (text: string) => (
    <div className="flex items-center gap-3 mb-4">
      <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
        {text}
      </span>
      <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
    </div>
  )

  // Zero state — rendered after all hooks
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-muted)' }}>
            <rect x="3" y="3" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="3" y="10" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
            <rect x="3" y="17" width="18" height="4" rx="1" stroke="currentColor" strokeWidth="1.5"/>
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Henüz veri yok</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            İlk başvurunu ekle ve istatistiklerin burada görünsün
          </p>
        </div>
        <a
          href="/dashboard"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--teal)' }}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
            <path d="M7 1v12M1 7h12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          İlk Başvurunu Ekle
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Analitik</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {total} başvurunun genel görünümü
        </p>
      </div>

      {/* Stat cards */}
      {sectionLabel('Özet')}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Başvuru" value={total} sub="tüm zamanlar" />
        <StatCard
          label="Mülakat Oranı"
          value={`${interviewRate}%`}
          sub={`${interviewCount} mülakat / ${appliedTotal} başvuru`}
          accent={interviewRate >= 20 ? '#10b981' : undefined}
        />
        <StatCard
          label="Teklif Oranı"
          value={`${offerRate}%`}
          sub={`${offeredCount} teklif`}
          accent={offeredCount > 0 ? '#10b981' : undefined}
        />
        {/* Avg salary card with toggle */}
        <div
          className="rounded-2xl p-5 flex flex-col gap-1"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>Ort. Maaş Beklentisi</span>
            <div
              className="flex rounded-md overflow-hidden text-xs"
              style={{ border: '1px solid var(--border-strong)' }}
            >
              {(['monthly', 'yearly'] as const).map(p => (
                <button
                  key={p}
                  onClick={() => setSalaryPeriod(p)}
                  className="px-2 py-0.5 transition-colors"
                  style={{
                    background: salaryPeriod === p ? TEAL : 'transparent',
                    color: salaryPeriod === p ? '#fff' : 'var(--text-muted)',
                  }}
                >
                  {p === 'monthly' ? 'Ay' : 'Yıl'}
                </button>
              ))}
            </div>
          </div>
          <span className="text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {avgSalary ? formatSalary(avgSalary, salaryPeriod) : '—'}
          </span>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {salaryApps.length > 0 ? `${salaryApps.length} başvurudan` : 'maaş verisi yok'}
          </span>
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Bar chart — by status */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {sectionLabel('Duruma Göre')}
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={byStatus} barSize={28}>
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#6b7280' }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
                width={24}
              />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {byStatus.map(entry => (
                  <Cell key={entry.status} fill={entry.color} fillOpacity={0.85} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Area chart — weekly */}
        <div
          className="rounded-2xl p-5"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        >
          {sectionLabel('Haftalık Başvuru')}
          {weeklyData.length === 0 ? (
            <div className="flex items-center justify-center h-[220px]">
              <span className="text-sm" style={{ color: 'var(--text-muted)' }}>
                Henüz başvuru tarihi verisi yok
              </span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={weeklyData}>
                <defs>
                  <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={TEAL} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={TEAL} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="week"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                  width={24}
                />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="count"
                  stroke={TEAL}
                  strokeWidth={2}
                  fill="url(#tealGrad)"
                  dot={{ fill: TEAL, r: 3, strokeWidth: 0 }}
                  activeDot={{ r: 5, fill: TEAL }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Upcoming events */}
      <div>
        {sectionLabel('Yaklaşan Etkinlikler (7 gün)')}
        {upcoming.length === 0 ? (
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
          >
            <svg className="mx-auto mb-3" width="28" height="28" viewBox="0 0 24 24" fill="none" style={{ color: 'var(--text-muted)' }}>
              <rect x="3" y="4" width="18" height="17" rx="3" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M3 9h18" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M8 2v4M16 2v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Önümüzdeki 7 günde etkinlik yok</p>
          </div>
        ) : (
          <div className="space-y-2">
            {upcoming.map((ev, i) => {
              const isDeadline = ev.type === 'deadline'
              const color = isDeadline
                ? (ev.days <= 1 ? '#ef4444' : ev.days <= 3 ? '#f59e0b' : '#6b7280')
                : '#3b82f6'
              const bgColor = isDeadline
                ? (ev.days <= 1 ? 'rgba(239,68,68,0.08)' : ev.days <= 3 ? 'rgba(245,158,11,0.08)' : 'var(--bg-card)')
                : 'rgba(59,130,246,0.08)'

              return (
                <div
                  key={i}
                  className="flex items-center gap-4 rounded-xl px-4 py-3"
                  style={{ background: bgColor, border: `1px solid ${color}22` }}
                >
                  {/* Icon */}
                  <div
                    className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: `${color}18` }}
                  >
                    {isDeadline ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color }}>
                        <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M7 4v3.5l2 1.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color }}>
                        <rect x="1.5" y="2" width="11" height="10" rx="2" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M1.5 5.5h11" stroke="currentColor" strokeWidth="1.3"/>
                        <path d="M4.5 1v2M9.5 1v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                      </svg>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                        {ev.app.company}
                      </span>
                      <span className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>
                        · {ev.app.position}
                      </span>
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {isDeadline ? 'Son başvuru tarihi' : 'Mülakat'}
                    </div>
                  </div>

                  {/* Days badge */}
                  <div
                    className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${color}18`, color }}
                  >
                    {ev.days === 0 ? 'Bugün' : ev.days === 1 ? 'Yarın' : `${ev.days} gün`}
                  </div>

                  {/* Date */}
                  <div className="flex-shrink-0 text-xs tabular-nums" style={{ color: 'var(--text-muted)' }}>
                    {ev.date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
