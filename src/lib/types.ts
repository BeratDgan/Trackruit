export type ApplicationStatus = 'wishlist' | 'applied' | 'interview' | 'offered' | 'rejected'

export interface Application {
  id: string
  user_id: string
  company: string
  position: string
  status: ApplicationStatus
  url: string | null
  notes: string | null
  salary?: number | null
  salary_period?: 'monthly' | 'yearly' | null
  location?: string | null
  deadline?: string | null
  applied_date?: string | null
  interview_date?: string | null
  created_at: string
  updated_at: string
}
