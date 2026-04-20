'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

function EyeOpen() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.75"/>
    </svg>
  )
}

function EyeOff() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19M1 1l22 22" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

function PasswordInput({
  id, value, onChange, placeholder, autoComplete, hasError,
}: {
  id: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  autoComplete: string
  hasError?: boolean
}) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        id={id}
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="input-base"
        style={{ paddingRight: '2.75rem', ...(hasError ? { borderColor: '#ef4444' } : {}) }}
      />
      <button
        type="button"
        onClick={() => setShow(v => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded"
        style={{ color: 'var(--text-muted)' }}
        aria-label={show ? 'Şifreyi gizle' : 'Şifreyi göster'}
        tabIndex={-1}
      >
        {show ? <EyeOff /> : <EyeOpen />}
      </button>
    </div>
  )
}

export default function ResetPasswordForm() {
  const supabase = createClient()

  const [password, setPassword]               = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors]                   = useState<Record<string, string>>({})
  const [loading, setLoading]                 = useState(false)
  const [done, setDone]                       = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs: Record<string, string> = {}
    if (password.length < 8) errs.password = 'Şifre en az 8 karakter olmalıdır'
    if (password !== confirmPassword) errs.confirm = 'Şifreler eşleşmiyor'
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)

    if (error) {
      setErrors({ form: 'Şifre güncellenemedi. Lütfen tekrar deneyin.' })
      return
    }
    setDone(true)
  }

  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-strong)',
    boxShadow: '0 0 0 1px rgba(10,166,150,0.06), 0 24px 64px rgba(0,0,0,0.55)',
  }

  if (done) {
    return (
      <div
        className="w-full rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        style={cardStyle}
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            background: 'rgba(10,166,150,0.1)',
            border: '1.5px solid rgba(10,166,150,0.28)',
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path d="M5 13l4 4L19 7" stroke="var(--teal)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            Şifren güncellendi
          </p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
            Yeni şifrenle giriş yapabilirsin.
          </p>
        </div>
        <a
          href="/login"
          className="flex items-center justify-center gap-2 w-full rounded-xl text-sm font-semibold text-white transition-opacity"
          style={{ background: 'var(--teal)', minHeight: 44 }}
        >
          Giriş Yap
        </a>
      </div>
    )
  }

  return (
    <div className="w-full rounded-2xl flex flex-col overflow-hidden" style={cardStyle}>
      <div className="px-6 pt-6 pb-4">
        <h2
          className="text-lg font-semibold"
          style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
        >
          Yeni şifreni belirle
        </h2>
        <p className="text-sm mt-1.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
          En az 8 karakter olacak şekilde yeni bir şifre oluştur.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="px-6 pt-2 pb-6 flex flex-col gap-3.5" noValidate>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rp-password" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Yeni Şifre
          </label>
          <PasswordInput
            id="rp-password"
            value={password}
            onChange={v => { setPassword(v); setErrors(p => { const n = { ...p }; delete n.password; return n }) }}
            placeholder="En az 8 karakter"
            autoComplete="new-password"
            hasError={!!errors.password}
          />
          {errors.password && (
            <p className="text-xs" style={{ color: '#ef4444' }} role="alert">{errors.password}</p>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="rp-confirm" className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
            Şifreyi Onayla
          </label>
          <PasswordInput
            id="rp-confirm"
            value={confirmPassword}
            onChange={v => { setConfirmPassword(v); setErrors(p => { const n = { ...p }; delete n.confirm; return n }) }}
            placeholder="Şifreyi tekrar girin"
            autoComplete="new-password"
            hasError={!!errors.confirm}
          />
          {errors.confirm && (
            <p className="text-xs" style={{ color: '#ef4444' }} role="alert">{errors.confirm}</p>
          )}
        </div>

        {errors.form && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-xl text-xs"
            role="alert"
            aria-live="polite"
            style={{
              background: 'var(--status-rejected-bg)',
              border: '1px solid rgba(248,113,113,0.18)',
              color: 'var(--status-rejected-text)',
            }}
          >
            {errors.form}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--teal)', minHeight: 44, marginTop: 2 }}
        >
          {loading ? <Spinner /> : 'Şifreyi Güncelle'}
        </button>
      </form>
    </div>
  )
}
