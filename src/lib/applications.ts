import { createClient } from '@/lib/supabase/server'
import type { Application, ApplicationStatus } from '@/lib/types'

export async function getApplications(): Promise<Application[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return data
}

export async function createApplication(input: {
  company: string
  position: string
  status: ApplicationStatus
  url?: string
  notes?: string
  salary?: number | null
  salary_period?: 'monthly' | 'yearly' | null
  location?: string | null
  deadline?: string | null
  applied_date?: string | null
  interview_date?: string | null
}): Promise<Application> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  // Enforce free-plan limit
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan_type')
    .eq('id', user.id)
    .single()

  if (!profile || profile.plan_type === 'free') {
    const { count } = await supabase
      .from('applications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)

    if ((count ?? 0) >= 20) throw new Error('Free plan limit reached')
  }

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company: input.company,
      position: input.position,
      status: input.status,
      url: input.url ?? null,
      notes: input.notes ?? null,
      salary: input.salary ?? null,
      salary_period: input.salary_period ?? null,
      location: input.location ?? null,
      deadline: input.deadline ?? null,
      applied_date: input.applied_date ?? null,
      interview_date: input.interview_date ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateApplication(
  id: string,
  input: Partial<Pick<Application, 'company' | 'position' | 'status' | 'url' | 'notes' | 'salary' | 'salary_period' | 'location' | 'deadline' | 'applied_date' | 'interview_date'>>
): Promise<Application> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('applications')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function bulkCreateApplications(
  userId: string,
  rows: Array<{
    company: string
    position: string
    status: ApplicationStatus
    url?: string | null
    notes?: string | null
    salary?: number | null
    salary_period?: 'monthly' | 'yearly' | null
    location?: string | null
    deadline?: string | null
    applied_date?: string | null
    interview_date?: string | null
  }>
): Promise<Application[]> {
  const supabase = createClient()

  const records = rows.map(r => ({ ...r, user_id: userId }))
  const { data, error } = await supabase
    .from('applications')
    .insert(records)
    .select()

  if (error) throw new Error(error.message)

  return data
}

export async function deleteApplication(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
