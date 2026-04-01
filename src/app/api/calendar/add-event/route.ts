import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'

const CALENDAR_API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events'

export async function POST(request: Request) {
  try {
    // Verify Supabase session (user must be logged in)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { company, position, type, date } = await request.json()

    if (!company || !position || !type || !date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    if (type !== 'interview' && type !== 'deadline') {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Read Google access token from httpOnly cookie set at /auth/callback
    const cookieStore = cookies()
    const accessToken = cookieStore.get('g_token')?.value

    if (!accessToken) {
      return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
    }

    let event: Record<string, unknown>

    if (type === 'interview') {
      event = {
        summary: `Mülakat – ${company} (${position})`,
        start: { dateTime: `${date}T10:00:00`, timeZone: 'Europe/Istanbul' },
        end:   { dateTime: `${date}T11:00:00`, timeZone: 'Europe/Istanbul' },
      }
    } else {
      // All-day event: Google Calendar requires end date = start date + 1 day
      const endDate = new Date(date)
      endDate.setDate(endDate.getDate() + 1)
      const endStr = endDate.toISOString().split('T')[0]

      event = {
        summary: `Son Başvuru – ${company} (${position})`,
        start: { date },
        end:   { date: endStr },
      }
    }

    const res = await fetch(CALENDAR_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(event),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      const message: string = err?.error?.message ?? ''

      // 401 = token expired, 403 insufficient scopes = need calendar permission
      if (res.status === 401 || (res.status === 403 && message.toLowerCase().includes('insufficient'))) {
        return NextResponse.json({ error: 'reauth_required' }, { status: 403 })
      }

      throw new Error(message || `Google Calendar error ${res.status}`)
    }

    const data = await res.json()
    return NextResponse.json({ success: true, eventId: data.id, eventLink: data.htmlLink })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
