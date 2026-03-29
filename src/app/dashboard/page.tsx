import { getApplications } from '@/lib/applications'
import ApplicationList from '@/components/ApplicationList'

export default async function DashboardPage() {
  const applications = await getApplications()

  return <ApplicationList initialApplications={applications} />
}
