import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from './ResetPasswordForm'

export default async function ResetPasswordPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Must arrive here via the password-reset link (which sets a session)
  if (!user) redirect('/login')

  return (
    <main
      className="min-h-dvh flex items-center justify-center p-6"
      style={{ background: 'var(--bg-base)' }}
    >
      <div className="w-full max-w-sm">
        <ResetPasswordForm />
      </div>
    </main>
  )
}
