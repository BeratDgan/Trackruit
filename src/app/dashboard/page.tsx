import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { getApplications } from '@/lib/applications'
import ApplicationList from '@/components/ApplicationList'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [applications, profileResult] = await Promise.all([
    getApplications(),
    supabase.from('profiles').select('plan_type').eq('id', user.id).single(),
  ])

  const planType = (profileResult.data?.plan_type ?? 'free') as 'free' | 'pro'

  return (
    <ApplicationList
      initialApplications={applications}
      planType={planType}
    />
  )
}
