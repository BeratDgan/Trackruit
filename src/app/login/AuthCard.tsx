'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

// ── Icon helpers ────────────────────────────────────────────────────────────

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05" />
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  )
}

function Spinner() {
  return (
    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity="0.25"/>
      <path d="M12 2a10 10 0 0110 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
    </svg>
  )
}

// ── Error translator ────────────────────────────────────────────────────────
function translateError(msg: string): string {
  if (msg.includes('Invalid login credentials'))         return 'E-posta veya şifre hatalı'
  if (msg.includes('Email not confirmed'))               return 'Lütfen önce e-postanızı doğrulayın'
  if (msg.includes('User already registered'))           return 'Bu e-posta adresi zaten kayıtlı'
  if (msg.includes('Password should be'))                return 'Şifre en az 6 karakter olmalıdır'
  if (msg.includes('rate limit') || msg.includes('too many requests')) return 'Çok fazla deneme. Lütfen biraz bekleyin.'
  if (msg.includes('Unable to validate') || msg.includes('valid email')) return 'Geçersiz e-posta adresi'
  if (msg.includes('signup is disabled'))                return 'Kayıt şu anda kapalı'
  return 'Bir hata oluştu. Lütfen tekrar deneyin.'
}

// ── Password input with show/hide toggle ────────────────────────────────────
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

// ── Field wrapper ───────────────────────────────────────────────────────────
function Field({
  id, label, error, children,
}: {
  id?: string
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-xs font-medium"
        style={{ color: 'var(--text-secondary)' }}
      >
        {label}
      </label>
      {children}
      {error && (
        <p className="text-xs flex items-center gap-1" style={{ color: '#ef4444' }} role="alert">
          <svg width="10" height="10" viewBox="0 0 12 12" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
            <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          {error}
        </p>
      )}
    </div>
  )
}

// ── Types ────────────────────────────────────────────────────────────────────
type Tab       = 'signin' | 'signup'
type FormState = 'idle' | 'loading' | 'success-verify' | 'success-reset'

// ── AuthCard ─────────────────────────────────────────────────────────────────
export default function AuthCard() {
  const supabase = createClient()

  const [tab,        setTab]        = useState<Tab>('signin')
  const [showForgot, setShowForgot] = useState(false)

  const [email,           setEmail]           = useState('')
  const [password,        setPassword]        = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [errors,    setErrors]    = useState<Record<string, string>>({})
  const [formState, setFormState] = useState<FormState>('idle')
  const [successMsg, setSuccessMsg] = useState('')

  const loading = formState === 'loading'

  // ── Helpers ────────────────────────────────────────────────────────────
  function switchTab(t: Tab) {
    setTab(t)
    setErrors({})
    setPassword('')
    setConfirmPassword('')
    setShowForgot(false)
    setFormState('idle')
  }

  function clearError(field: string) {
    setErrors(prev => { const n = { ...prev }; delete n[field]; return n })
  }

  function validate(): Record<string, string> {
    const errs: Record<string, string> = {}
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Geçerli bir e-posta adresi girin'
    }
    if (!showForgot) {
      if (password.length < 8) errs.password = 'Şifre en az 8 karakter olmalıdır'
      if (tab === 'signup' && password !== confirmPassword) {
        errs.confirm = 'Şifreler eşleşmiyor'
      }
    }
    return errs
  }

  // ── Submit handler ─────────────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) { setErrors(errs); return }
    setErrors({})
    setFormState('loading')

    try {
      // ── Forgot password ──────────────────────────────────────────────
      if (showForgot) {
        const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
          // NOTE (Berat): Set password reset redirect URL in Supabase Dashboard →
          // Authentication → URL Configuration → Redirect URLs:
          // https://trackruit.me/auth/reset-password
          redirectTo: `${location.origin}/auth/callback?next=/auth/reset-password`,
        })
        if (error) { setErrors({ form: translateError(error.message) }); setFormState('idle'); return }
        setSuccessMsg('Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.')
        setFormState('success-reset')
        return
      }

      // ── Sign in ──────────────────────────────────────────────────────
      if (tab === 'signin') {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })
        if (error) { setErrors({ form: translateError(error.message) }); setFormState('idle'); return }
        // Ensure profiles row exists (no-op if already there)
        if (data.user) {
          await supabase.from('profiles').upsert(
            { id: data.user.id, email: data.user.email, plan_type: 'free' },
            { onConflict: 'id', ignoreDuplicates: true }
          )
        }
        window.location.href = '/dashboard'
        return
      }

      // ── Sign up ──────────────────────────────────────────────────────
      // NOTE (Berat): Configure in Supabase Dashboard → Authentication → Providers → Email:
      // - Email auth: Enabled
      // - Confirm email: Enable for production / Disable for easier local testing
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${location.origin}/auth/callback`,
        },
      })
      if (error) { setErrors({ form: translateError(error.message) }); setFormState('idle'); return }

      if (data.session) {
        // Email confirmation is disabled — user is immediately authenticated
        if (data.user) {
          await supabase.from('profiles').upsert(
            { id: data.user.id, email: data.user.email, plan_type: 'free' },
            { onConflict: 'id', ignoreDuplicates: true }
          )
        }
        window.location.href = '/dashboard'
        return
      }

      // Email confirmation required — show success message
      setSuccessMsg('Doğrulama e-postası gönderildi. Lütfen e-postanızı kontrol edin.')
      setFormState('success-verify')
    } catch {
      setErrors({ form: 'Bir hata oluştu. Lütfen tekrar deneyin.' })
      setFormState('idle')
    }
  }

  async function handleGoogleSignIn() {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${location.origin}/auth/callback` },
    })
  }

  // ── Shared card style ──────────────────────────────────────────────────
  const cardStyle = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-strong)',
    boxShadow: '0 0 0 1px rgba(10,166,150,0.06), 0 24px 64px rgba(0,0,0,0.55), 0 8px 24px rgba(0,0,0,0.25)',
  }

  // ── Success state ──────────────────────────────────────────────────────
  if (formState === 'success-verify' || formState === 'success-reset') {
    const isVerify = formState === 'success-verify'
    return (
      <div
        className="w-full rounded-2xl p-8 flex flex-col items-center gap-5 text-center"
        style={cardStyle}
      >
        {/* Icon */}
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

        {/* Message */}
        <div>
          <p className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
            {isVerify ? 'E-posta gönderildi' : 'Bağlantı gönderildi'}
          </p>
          <p className="text-sm mt-2 leading-relaxed" style={{ color: 'var(--text-secondary)', maxWidth: 288 }}>
            {successMsg}
          </p>
        </div>

        {/* Decorative envelope icon */}
        <div
          className="w-full flex items-center justify-center py-3 rounded-xl"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)' }}
        >
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style={{ color: 'var(--text-muted)' }}>
            <rect x="2" y="6" width="28" height="20" rx="3" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M2 10l14 9 14-9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>

        <button
          type="button"
          onClick={() => { setFormState('idle'); setShowForgot(false); setSuccessMsg('') }}
          className="flex items-center gap-1.5 text-xs transition-colors"
          style={{ color: 'var(--text-muted)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Giriş ekranına dön
        </button>
      </div>
    )
  }

  // ── Main card ──────────────────────────────────────────────────────────
  return (
    <div className="w-full rounded-2xl flex flex-col overflow-hidden" style={cardStyle}>

      {/* ── Header ──────────────────────────────────────────────────── */}
      {showForgot ? (
        /* Forgot password header */
        <div className="px-6 pt-6 pb-4">
          <button
            type="button"
            onClick={() => { setShowForgot(false); setErrors({}) }}
            className="flex items-center gap-1.5 text-xs mb-4 transition-colors"
            style={{ color: 'var(--text-muted)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Geri dön
          </button>
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            Şifreni sıfırla
          </h2>
          <p className="text-sm mt-1.5 leading-snug" style={{ color: 'var(--text-secondary)' }}>
            E-posta adresini gir, sıfırlama bağlantısı gönderelim.
          </p>
        </div>
      ) : (
        /* Normal header with tab switcher */
        <div className="px-6 pt-6 pb-0">
          <h2
            className="text-lg font-semibold"
            style={{ color: 'var(--text-primary)', letterSpacing: '-0.02em' }}
          >
            {tab === 'signin' ? 'Hesabına giriş yap' : 'Hesap oluştur'}
          </h2>

          {/* Tabs */}
          <div className="flex mt-4" style={{ borderBottom: '1px solid var(--border)' }}>
            {(['signin', 'signup'] as Tab[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => switchTab(t)}
                className="relative pb-3 mr-5 text-sm font-medium transition-colors"
                style={{ color: tab === t ? 'var(--teal)' : 'var(--text-muted)' }}
              >
                {t === 'signin' ? 'Giriş Yap' : 'Kayıt Ol'}
                {tab === t && (
                  <span
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                    style={{ background: 'var(--teal)' }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Form ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSubmit}
        className="px-6 pt-5 pb-5 flex flex-col gap-3.5"
        noValidate
      >
        {/* Email */}
        <Field id="auth-email" label="E-posta" error={errors.email}>
          <input
            id="auth-email"
            type="email"
            inputMode="email"
            value={email}
            onChange={e => { setEmail(e.target.value); clearError('email') }}
            placeholder="ornek@email.com"
            autoComplete="email"
            className="input-base"
            style={errors.email ? { borderColor: '#ef4444' } : {}}
          />
        </Field>

        {/* Password */}
        {!showForgot && (
          <Field id="auth-password" label="Şifre" error={errors.password}>
            <PasswordInput
              id="auth-password"
              value={password}
              onChange={v => { setPassword(v); clearError('password') }}
              placeholder={tab === 'signup' ? 'En az 8 karakter' : '••••••••'}
              autoComplete={tab === 'signup' ? 'new-password' : 'current-password'}
              hasError={!!errors.password}
            />
          </Field>
        )}

        {/* Confirm password — signup only */}
        {!showForgot && tab === 'signup' && (
          <Field id="auth-confirm" label="Şifreyi Onayla" error={errors.confirm}>
            <PasswordInput
              id="auth-confirm"
              value={confirmPassword}
              onChange={v => { setConfirmPassword(v); clearError('confirm') }}
              placeholder="Şifreyi tekrar girin"
              autoComplete="new-password"
              hasError={!!errors.confirm}
            />
          </Field>
        )}

        {/* Forgot password link — signin only */}
        {!showForgot && tab === 'signin' && (
          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => { setShowForgot(true); setErrors({}) }}
              className="text-xs transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--teal)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              Şifremi unuttum
            </button>
          </div>
        )}

        {/* Global error */}
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
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, marginTop: 1 }} aria-hidden>
              <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3"/>
              <path d="M6 3.5v3M6 8v.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
            </svg>
            {errors.form}
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white transition-opacity disabled:opacity-60"
          style={{ background: 'var(--teal)', minHeight: 44, marginTop: 2 }}
        >
          {loading ? (
            <Spinner />
          ) : showForgot
            ? 'Sıfırlama Bağlantısı Gönder'
            : tab === 'signin'
            ? 'Giriş Yap'
            : 'Hesap Oluştur'}
        </button>
      </form>

      {/* ── Divider + Google — hidden when in forgot mode ────────────── */}
      {!showForgot && (
        <>
          <div className="px-6 flex items-center gap-3 pb-1">
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>veya</span>
            <div className="flex-1 h-px" style={{ background: 'var(--border)' }} />
          </div>

          <div className="px-6 pb-6 pt-3">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-3 w-full px-4 rounded-xl text-sm font-medium transition-all duration-150"
              style={{
                border: '1.5px solid var(--border-strong)',
                color: 'var(--text-primary)',
                background: 'var(--bg-raised)',
                minHeight: 44,
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = 'rgba(10,166,150,0.4)'
                e.currentTarget.style.background = 'var(--teal-glow)'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = 'var(--border-strong)'
                e.currentTarget.style.background = 'var(--bg-raised)'
              }}
            >
              <GoogleIcon />
              Google ile devam et
            </button>
          </div>
        </>
      )}
    </div>
  )
}
