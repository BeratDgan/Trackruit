import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

type Tone = 'warm' | 'direct' | 'deadpan' | 'formal'

const TONE_INSTRUCTIONS: Record<Tone, string> = {
  warm: 'Samimi, sıcak ve insancıl bir ton kullan. Kullanıcının hikayesi ön planda olsun, aşırı resmi olma. "Merhaba" ve "Sevgiler," gibi yumuşak ifadeler tercih et.',
  direct: 'Net, özlü ve doğrudan bir ton kullan. Gereksiz süslemeler yok. Kısa ve güçlü cümleler. Kullanıcının değerini somut sonuçlarla ifade et.',
  deadpan: 'Sakin, düz, az duygulu bir ton kullan. Abartısız, gerçekçi, belki hafif kuru bir mizah sezgisi olsun. Aşırı heyecanlı olma.',
  formal: 'Resmi, profesyonel ve geleneksel bir ton kullan. "Sayın Yetkili" gibi hitaplarla başla, "Saygılarımla" ile bitir. Klasik iş mektubu yapısı.',
}

const TONE_CLOSINGS: Record<Tone, string> = {
  warm: 'Sevgiler,',
  direct: 'Best,',
  deadpan: 'Selamlar,',
  formal: 'Saygılarımla,',
}

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
  jobDescription: string | null,
  tone: Tone,
): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set')

  const systemPrompt = `You are an expert cover letter writer writing in Turkish. Write professional, personalized cover letters tailored to the specific job and company. 3–4 concise paragraphs. Highlight relevant skills. Sound human, not generic. Never use placeholder text like [İsim] or [Name] — write a complete, ready-to-send letter.

Tone for this letter:
${TONE_INSTRUCTIONS[tone]}

End the letter with: "${TONE_CLOSINGS[tone]}" followed by the user's first name on the next line. If you don't know the name, just end with "${TONE_CLOSINGS[tone]}" and no name.`

  const userPrompt = `Write a cover letter in Turkish for this application:

Company: ${company}
Position: ${position}
${notes ? `Applicant's notes about this role: ${notes}` : ''}

${jobDescription
      ? `Job posting details:\n${jobDescription}`
      : 'No job posting details available. Write a strong, general-purpose letter that emphasizes transferable skills and interest in the company.'
    }

Output only the letter body. No commentary.`

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
      temperature: 0.75,
      max_tokens: 800,
    }),
    signal: AbortSignal.timeout(30000),
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
    const body = await request.json().catch(() => ({}))
    const { applicationId, jobDescription, tone = 'warm' } = body

    if (!applicationId) {
      return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
    }

    const validTones: Tone[] = ['warm', 'direct', 'deadpan', 'formal']
    const resolvedTone: Tone = validTones.includes(tone) ? tone : 'warm'

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

    let resolvedDescription: string | null = jobDescription?.trim() || null
    if (!resolvedDescription && app.url) {
      resolvedDescription = await tryFetchJobDescription(app.url)
    }
    // NOTE: no longer returning needsManualInput — we generate a general
    // letter when description unavailable. Spec mobile contract expects
    // always-returns-a-letter (or an error).

    const letter = await generateCoverLetter(
      app.company,
      app.position,
      app.notes,
      resolvedDescription,
      resolvedTone,
    )

    return NextResponse.json({
      letter,
      draftNumber: 1,
      editedAt: new Date().toISOString(),
      tone: resolvedTone,
      hadJobDescription: !!resolvedDescription,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Internal server error'
    const status = message.includes('timeout') ? 504 : 500
    return NextResponse.json({ error: message }, { status })
  }
}