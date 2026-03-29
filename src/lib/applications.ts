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
}): Promise<Application> {
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')

  const { data, error } = await supabase
    .from('applications')
    .insert({
      user_id: user.id,
      company: input.company,
      position: input.position,
      status: input.status,
      url: input.url ?? null,
      notes: input.notes ?? null,
    })
    .select()
    .single()

  if (error) throw new Error(error.message)

  return data
}

export async function updateApplication(
  id: string,
  input: Partial<Pick<Application, 'company' | 'position' | 'status' | 'url' | 'notes'>>
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

export async function deleteApplication(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('applications')
    .delete()
    .eq('id', id)

  if (error) throw new Error(error.message)
}
