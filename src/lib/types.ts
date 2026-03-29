export type ApplicationStatus = 'wishlist' | 'applied' | 'interview' | 'offered' | 'rejected'

export interface Application {
  id: string
  user_id: string
  company: string
  position: string
  status: ApplicationStatus
  url: string | null
  notes: string | null
  created_at: string
  updated_at: string
}
