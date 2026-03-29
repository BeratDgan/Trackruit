'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

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
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <header className="h-16 bg-white border-b border-gray-100 px-6 flex items-center justify-between sticky top-0 z-30">
      <Image
        src="/logo.png"
        alt="Trackruit"
        width={130}
        height={36}
        priority
        className="h-8 w-auto"
      />

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2.5">
          {avatarUrl ? (
            <Image
              src={avatarUrl}
              alt={name}
              width={32}
              height={32}
              className="rounded-full ring-2 ring-gray-100"
            />
          ) : (
            <span className="h-8 w-8 rounded-full bg-brand-navy text-white text-xs font-semibold flex items-center justify-center ring-2 ring-gray-100">
              {initials}
            </span>
          )}
          <span className="text-sm text-gray-600 hidden sm:block">{email}</span>
        </div>

        <div className="h-4 w-px bg-gray-200" />

        <button
          onClick={handleSignOut}
          className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          Çıkış
        </button>
      </div>
    </header>
  )
}
