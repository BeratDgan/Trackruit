import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { bulkCreateApplications } from '@/lib/applications'

export async function POST(request: Request) {
  try {
    const { rows } = await request.json()

    if (!Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const apps = await bulkCreateApplications(user.id, rows)
    return NextResponse.json({ inserted: apps.length, data: apps }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
