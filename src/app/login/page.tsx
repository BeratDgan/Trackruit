import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import GoogleSignInButton from './GoogleSignInButton'
import ThemeToggle from '@/components/ThemeToggle'

// ── Feature data ────────────────────────────────────────────────────────────
const FEATURES = [
  {
    title: 'Kanban Takibi',
    desc: 'Başvurularını görsel panoda sürükle-bırak ile organize et',
    accent: '#60A5FA',
    bg: 'rgba(96, 165, 250, 0.08)',
    border: 'rgba(96, 165, 250, 0.14)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <rect x="1" y="2" width="4" height="12" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="6" y="2" width="4" height="8" rx="1" stroke="currentColor" strokeWidth="1.4"/>
        <rect x="11" y="2" width="4" height="10" rx="1" stroke="currentColor" strokeWidth="1.4"/>
      </svg>
    ),
  },
  {
    title: 'AI Kapak Mektubu',
    desc: 'Her ilan için pozisyona özel mektup saniyeler içinde üret',
    accent: '#0AA696',
    bg: 'rgba(10, 166, 150, 0.08)',
    border: 'rgba(10, 166, 150, 0.14)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M8 1.5C4.41 1.5 1.5 4.41 1.5 8S4.41 14.5 8 14.5 14.5 11.59 14.5 8 11.59 1.5 8 1.5z" stroke="currentColor" strokeWidth="1.4"/>
        <path d="M5.5 8.5l1.5 1.5 3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  {
    title: 'Akıllı Analitik',
    desc: 'Mülakat oranı ve başarı trendlerini gerçek zamanlı izle',
    accent: '#FBBF24',
    bg: 'rgba(251, 191, 36, 0.08)',
    border: 'rgba(251, 191, 36, 0.14)',
    icon: (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
        <path d="M2 12l3.5-4 3 2.5L12 5l2 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M2 14h12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
      </svg>
    ),
  },
]

const STATS = [
  { value: '340+', label: 'Aktif kullanıcı' },
  { value: '12k',  label: 'Başvuru takibi' },
  { value: '94%',  label: 'Mülakat başarısı' },
]

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>

      {/* ── Left panel ──────────────────────────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-[52%] xl:w-1/2 flex-col justify-between p-12 xl:p-16 relative overflow-hidden"
        style={{ background: 'var(--navy)' }}
      >
        {/* Decorative grid background */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `
              linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
              linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px)
            `,
            backgroundSize: '48px 48px',
          }}
        />
        {/* Radial glow orb */}
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            top: '-80px',
            right: '-80px',
            width: '380px',
            height: '380px',
            background: 'radial-gradient(circle, rgba(10,166,150,0.12) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />
        <div
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: '60px',
            left: '-60px',
            width: '280px',
            height: '280px',
            background: 'radial-gradient(circle, rgba(96,165,250,0.07) 0%, transparent 70%)',
            borderRadius: '50%',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3 z-10">
          <Image
            src="/logo/trackruit-mark-on-dark.png"
            alt="Trackruit"
            width={319}
            height={342}
            style={{ height: 36, width: 'auto' }}
          />
          <span
            className="text-lg font-semibold tracking-wide"
            style={{ color: 'rgba(255,255,255,0.88)', letterSpacing: '-0.01em' }}
          >
            trackruit
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10 flex flex-col gap-8">
          {/* Badge */}
          <div className="inline-flex w-fit">
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium"
              style={{
                background: 'rgba(10, 166, 150, 0.12)',
                border: '1px solid rgba(10, 166, 150, 0.25)',
                color: '#0AA696',
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: '#0AA696' }}
              />
              AI Destekli Kariyer Platformu
            </span>
          </div>

          {/* Headline */}
          <div>
            <h1
              className="text-4xl xl:text-5xl font-light leading-tight"
              style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.03em' }}
            >
              Her başvurunu takip et,{' '}
              <span style={{ color: 'var(--teal)' }}>her fırsatı yakala.</span>
            </h1>
            <p
              className="text-base mt-4 font-light leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.42)', maxWidth: '360px' }}
            >
              Başvurularını yönet, AI ile öne çık, analitikle stratejini belirle.
            </p>
          </div>

          {/* Feature cards */}
          <div className="flex flex-col gap-2.5">
            {FEATURES.map(f => (
              <div
                key={f.title}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl"
                style={{
                  background: f.bg,
                  border: `1px solid ${f.border}`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: f.border,
                    color: f.accent,
                  }}
                >
                  {f.icon}
                </div>
                <div>
                  <p
                    className="text-sm font-medium"
                    style={{ color: 'rgba(255,255,255,0.88)' }}
                  >
                    {f.title}
                  </p>
                  <p
                    className="text-xs mt-0.5 leading-snug"
                    style={{ color: 'rgba(255,255,255,0.38)' }}
                  >
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="relative z-10 flex gap-8">
          {STATS.map(({ value, label }) => (
            <div key={label}>
              <p
                className="text-2xl font-semibold"
                style={{ color: 'var(--teal)', letterSpacing: '-0.02em' }}
              >
                {value}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right panel ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        {/* Subtle right-panel glow */}
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 80% 60% at 50% 50%, rgba(10,166,150,0.04) 0%, transparent 70%)',
          }}
        />

        {/* Theme toggle */}
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>

        {/* Auth card */}
        <div
          className="w-full max-w-sm flex flex-col gap-7 relative"
        >
          {/* Mobile logo */}
          <div className="lg:hidden flex flex-col items-center gap-3">
            <Image
              src="/logo/trackruit-mark-on-dark.png"
              alt="Trackruit"
              width={319}
              height={342}
              style={{ height: 40, width: 'auto' }}
            />
            <span
              className="text-base font-medium"
              style={{ color: 'var(--text-secondary)' }}
            >
              AI destekli kariyer takibi
            </span>
          </div>

          {/* Card */}
          <div
            className="w-full rounded-2xl p-8 flex flex-col gap-7"
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-strong)',
              boxShadow: '0 0 0 1px rgba(10,166,150,0.06), 0 32px 80px rgba(0,0,0,0.6), 0 8px 24px rgba(0,0,0,0.3)',
            }}
          >
            <div>
              <h2
                className="text-xl font-semibold"
                style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
              >
                Hoş geldin 👋
              </h2>
              <p className="text-sm mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                Hesabın yoksa otomatik olarak oluşturulur.
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <GoogleSignInButton />

              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  Ücretsiz · Kredi kartı gerekmez
                </span>
                <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
              </div>
            </div>

            {/* Feature bullets (mobile) */}
            <div className="flex flex-col gap-2 lg:hidden">
              {FEATURES.map(f => (
                <div key={f.title} className="flex items-center gap-2.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                    style={{ background: f.accent }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {f.title}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ToS */}
          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Giriş yaparak{' '}
            <span
              className="underline cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
            >
              Kullanım Koşulları
            </span>
            &apos;nı kabul etmiş olursun.
          </p>
        </div>
      </div>
    </main>
  )
}
