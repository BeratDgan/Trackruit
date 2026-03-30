import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// Strip HTML tags and collapse whitespace; truncate to keep tokens manageable
function extractText(html: string, maxLen = 4000): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .slice(0, maxLen)
}

async function tryFetchJobDescription(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Trackruit/1.0)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!res.ok) return null
    const html = await res.text()
    const text = extractText(html)
    return text.length > 100 ? text : null
  } catch {
    return null
  }
}

async function generateCoverLetter(
  company: string,
  position: string,
  notes: string | null,
  jobDescription: string,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const systemPrompt = `You are an expert cover letter writer. Write professional, personalized cover letters tailored to the specific job and company. Be concise (3–4 paragraphs), highlight relevant skills, and sound human — not generic. Match the language of the job description (default to Turkish if unclear).`

  const userPrompt = `Write a professional cover letter for this application:

Company: ${company}
Position: ${position}
${notes ? `Applicant's notes: ${notes}` : ''}

Job posting:
${jobDescription}

Write only the cover letter body — no meta-commentary or placeholders like [Your Name]. Use "Saygılarımla," or "Best regards," as closing depending on the detected language.`

  const res = await fetch(OPENAI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      max_tokens: 800,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err?.error?.message ?? `OpenAI error ${res.status}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() ?? ''
}

export async function POST(request: Request) {
  try {
    const { applicationId, jobDescription } = await request.json()
    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
    }

    // Verify auth + fetch application
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: app, error } = await supabase
      .from('applications')
      .select('company, position, notes, url')
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (error || !app) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 })
    }

    // Resolve job description
    let resolvedDescription: string | null = jobDescription?.trim() || null

    if (!resolvedDescription && app.url) {
      resolvedDescription = await tryFetchJobDescription(app.url)
    }

    if (!resolvedDescription) {
      return NextResponse.json({ needsManualInput: true })
    }

    const coverLetter = await generateCoverLetter(
      app.company,
      app.position,
      app.notes,
      resolvedDescription,
    )

    return NextResponse.json({ coverLetter })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
