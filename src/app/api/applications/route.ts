import { NextResponse } from 'next/server'
import { createApplication } from '@/lib/applications'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const app = await createApplication(body)
    return NextResponse.json(app, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message === 'Free plan limit reached' ? 403 : 500
    return NextResponse.json({ error: message }, { status })
  }
}
