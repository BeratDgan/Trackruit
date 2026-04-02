import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  const forwardedHost = request.headers.get('x-forwarded-host') || request.headers.get('host')
  const forwardedProto = request.headers.get('x-forwarded-proto') || 'http'

  const origin = forwardedHost ? `${forwardedProto}://${forwardedHost}` : new URL(request.url).origin

  if (!code) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  const supabase = createClient()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return NextResponse.redirect(`${origin}/login?error=auth`)
  }

  // If incremental auth passed a return URL via the OAuth state param, use it
  const next = searchParams.get('next')
  const redirectTo = next && next.startsWith('/') ? `${origin}${next}` : `${origin}/dashboard`
  const response = NextResponse.redirect(redirectTo)

  // Store Google access token so the calendar API route can use it server-side
  const providerToken = data.session?.provider_token
  if (providerToken) {
    response.cookies.set('g_token', providerToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 3500,
      path: '/',
    })
  }

  return response
}