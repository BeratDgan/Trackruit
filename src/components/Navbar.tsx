'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'
import ThemeToggle from './ThemeToggle'

interface NavbarProps {
  user: User
}

const NAV_LINKS = [
  { href: '/dashboard', label: 'Başvurular' },
  { href: '/dashboard/analytics', label: 'Analitik' },
]

export default function Navbar({ user }: NavbarProps) {
  const router   = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on route change
  useEffect(() => { setDropdownOpen(false) }, [pathname])

  async function handleSignOut() {
    setDropdownOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
  }

  const avatarUrl = user.user_metadata?.avatar_url as string | undefined
  const email     = user.email ?? ''
  const name      = (user.user_metadata?.full_name as string | undefined) ?? email
  const initials  = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()

  return (
    <header
      className="sticky top-0 z-30"
      style={{
        background: 'rgba(7, 17, 29, 0.92)',
        borderBottom: '1px solid var(--border)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      {/* ── Main row ──────────────────────────────────────────────────── */}
      <div className="h-14 px-4 sm:px-6 flex items-center justify-between">

        {/* Left: Logo + desktop nav */}
        <div className="flex items-center gap-5 sm:gap-6">
          <Image
            src="/logo/trackruit-on-dark.png"
            alt="Trackruit"
            width={1782}
            height={470}
            priority
            style={{ height: 24, width: 'auto' }}
          />

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => {
              const active = pathname === href
              return (
                <Link
                  key={href}
                  href={href}
                  className="relative px-3.5 py-1.5 rounded-lg text-sm transition-all duration-150"
                  style={{
                    color: active ? 'var(--teal)' : 'var(--text-secondary)',
                    background: active ? 'var(--teal-glow)' : 'transparent',
                    fontWeight: active ? 600 : 400,
                  }}
                  onMouseEnter={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-primary)'
                  }}
                  onMouseLeave={e => {
                    if (!active) (e.currentTarget as HTMLAnchorElement).style.color = 'var(--text-secondary)'
                  }}
                >
                  {label}
                  {active && (
                    <span
                      className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                      style={{ background: 'var(--teal)' }}
                    />
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Right: Theme toggle + Profile dropdown */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <div className="h-4 w-px hidden sm:block" style={{ background: 'var(--border-strong)' }} />

          {/* Profile dropdown */}
          <div ref={dropdownRef} className="relative">
            <button
              onClick={() => setDropdownOpen(prev => !prev)}
              className="flex items-center gap-2 pl-1.5 pr-2 py-1.5 rounded-xl transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-raised)')}
              onMouseLeave={e => {
                if (!dropdownOpen) e.currentTarget.style.background = 'transparent'
              }}
              aria-label="Hesap menüsü"
              aria-expanded={dropdownOpen}
            >
              {/* Avatar */}
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt={name}
                  width={28}
                  height={28}
                  className="rounded-full"
                  style={{ border: '2px solid var(--border-strong)' }}
                />
              ) : (
                <span
                  className="h-7 w-7 rounded-full text-white text-xs font-semibold flex items-center justify-center flex-shrink-0"
                  style={{ background: 'var(--teal-dark)' }}
                >
                  {initials}
                </span>
              )}

              {/* Chevron */}
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                className="hidden sm:block transition-transform duration-150"
                style={{
                  color: 'var(--text-muted)',
                  transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                }}
              >
                <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>

            {/* Dropdown panel */}
            {dropdownOpen && (
              <div
                className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border-strong)',
                  boxShadow: '0 16px 48px rgba(0,0,0,0.45), 0 4px 12px rgba(0,0,0,0.2)',
                  animation: 'modal-in 0.15s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  zIndex: 50,
                }}
              >
                {/* User info */}
                <div className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    {avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={name}
                        width={36}
                        height={36}
                        className="rounded-full flex-shrink-0"
                        style={{ border: '2px solid var(--border-strong)' }}
                      />
                    ) : (
                      <span
                        className="h-9 w-9 rounded-full text-white text-sm font-semibold flex items-center justify-center flex-shrink-0"
                        style={{ background: 'var(--teal-dark)' }}
                      >
                        {initials}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p
                        className="text-sm font-semibold truncate"
                        style={{ color: 'var(--text-primary)' }}
                        title={name}
                      >
                        {name}
                      </p>
                      <p
                        className="text-xs truncate mt-0.5"
                        style={{ color: 'var(--text-muted)' }}
                        title={email}
                      >
                        {email}
                      </p>
                    </div>
                  </div>

                  {/* Plan badge */}
                  <div className="mt-3">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
                      style={{
                        background: 'var(--teal-glow)',
                        border: '1px solid rgba(10, 166, 150, 0.2)',
                        color: 'var(--teal)',
                      }}
                    >
                      <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                        <path d="M5 1l1.18 2.39 2.64.38-1.91 1.86.45 2.63L5 7.07 2.64 8.26l.45-2.63L1.18 3.77l2.64-.38L5 1z" fill="currentColor"/>
                      </svg>
                      Free Plan
                    </span>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'var(--border)' }} />

                {/* Actions */}
                <div className="p-2">
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-colors text-left"
                    style={{ color: 'var(--status-rejected-text)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--status-rejected-bg)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                      <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3M11 11l3-3-3-3M14 8H6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Çıkış Yap
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile nav row ────────────────────────────────────────────── */}
      <div
        className="flex sm:hidden items-center gap-1 px-4 pb-2"
        style={{ borderTop: '1px solid var(--border)' }}
      >
        {NAV_LINKS.map(({ href, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 text-center px-3 py-3 rounded-lg text-sm transition-colors"
              style={{
                color: active ? 'var(--teal)' : 'var(--text-secondary)',
                background: active ? 'var(--teal-glow)' : 'transparent',
                fontWeight: active ? 600 : 400,
              }}
            >
              {label}
            </Link>
          )
        })}
      </div>
    </header>
  )
}
