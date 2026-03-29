import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import GoogleSignInButton from './GoogleSignInButton'
import ThemeToggle from '@/components/ThemeToggle'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) redirect('/dashboard')

  return (
    <main className="min-h-screen flex" style={{ background: 'var(--bg-base)' }}>
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14" style={{ background: 'var(--navy)' }}>
        <div className="flex items-center gap-3">
          <Image src="/logo/trackruit-mark-on-dark.png" alt="Trackruit" width={319} height={342} style={{ height: 40, width: 'auto' }} />
          <span className="text-lg font-semibold tracking-wide" style={{ color: 'rgba(255,255,255,0.90)', letterSpacing: '-0.01em' }}>trackruit</span>
        </div>

        <div>
          <p className="text-4xl font-light leading-snug" style={{ color: 'rgba(255,255,255,0.92)', letterSpacing: '-0.02em' }}>
            Her başvurunu takip et,<br />
            <span style={{ color: 'var(--teal)' }}>her fırsatı yakala.</span>
          </p>
          <p className="mt-5 text-base font-light" style={{ color: 'rgba(255,255,255,0.45)' }}>
            AI destekli kariyer yönetim platformu.
          </p>
        </div>

        <div className="flex gap-10">
          {[['340+', 'Aktif kullanıcı'], ['12k', 'Başvuru takibi'], ['94%', 'Mülakat başarısı']].map(([num, label]) => (
            <div key={label}>
              <p className="text-2xl font-semibold" style={{ color: 'var(--teal)' }}>{num}</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-5 right-5">
          <ThemeToggle />
        </div>
        <div
          className="w-full max-w-sm rounded-2xl p-10 flex flex-col gap-8"
          style={{ background: 'var(--bg-card)', border: '1px solid var(--border-strong)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}
        >
          <div className="lg:hidden flex justify-center">
            <Image src="/logo/trackruit-mark-on-dark.png" alt="Trackruit" width={319} height={342} style={{ height: 36, width: 'auto' }} />
          </div>

          <div>
            <h1 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>Giriş yap</h1>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              Hesabın yoksa otomatik oluşturulur.
            </p>
          </div>

          <GoogleSignInButton />

          <p className="text-xs text-center" style={{ color: 'var(--text-muted)' }}>
            Giriş yaparak{' '}
            <span className="underline cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Kullanım Koşulları</span>
            &apos;nı kabul etmiş olursun.
          </p>
        </div>
      </div>
    </main>
  )
}
