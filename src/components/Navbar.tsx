'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  user: User
}

export default function Navbar({ user }: NavbarProps) {
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const email = user.email ?? ''
  const name = (user.user_metadata?.full_name as string | undefined) ?? email
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header
      className="h-14 px-6 flex items-center justify-between sticky top-0 z-30"
      style={{
        background: 'rgba(7, 17, 29, 0.85)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
      }}
    >
      <Image src="/logo/trackruit-on-dark.png" alt="Trackruit" width={1782} height={470} priority style={{ height: 28, width: 'auto' }} />

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={30}
              height={30}
              className="rounded-full"
              style={{ border: '2px solid var(--border)' }}
            />
          ) : (
            <span
              className="h-[30px] w-[30px] rounded-full text-white text-xs font-semibold flex items-center justify-center flex-shrink-0"
              style={{ background: 'var(--navy)' }}
            >
              {initials}
            </span>
          )}
          <span className="text-sm hidden sm:block" style={{ color: 'var(--text-secondary)' }}>
            {email}
          </span>
        </div>

        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />

        <ThemeToggle />

        <div className="h-4 w-px" style={{ background: 'var(--border)' }} />

        <button
          onClick={handleSignOut}
          className="text-sm px-3 py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-raised)'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent'
            ;(e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)'
          }}
        >
          Çıkış
        </button>
      </div>
    </header>
  )
}
