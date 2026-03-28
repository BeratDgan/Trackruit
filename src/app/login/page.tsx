import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import GoogleSignInButton from './GoogleSignInButton'

export default async function LoginPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-10 flex flex-col items-center gap-6 w-full max-w-sm">
        <div className="flex flex-col items-center gap-1 text-center">
          <h1 className="text-2xl font-semibold text-gray-900">Trackruit&apos;e hoş geldin</h1>
          <p className="text-sm text-gray-500">Kariyerini takip etmeye başla</p>
        </div>
        <GoogleSignInButton />
      </div>
    </main>
  )
}
