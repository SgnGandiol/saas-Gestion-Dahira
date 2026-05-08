export interface MemberCategory {
  id: string
  name: string
  label: string
  weekly_amount: number
  color: string
  is_default: boolean
  sort_order: number
}

export interface Dahira {
  id: string
  name: string
  slug: string
  city?: string
  country: string
  phone?: string
  email?: string
  description?: string
  is_active: boolean
  created_at?: string
}

export type MemberAvailabilityStatus = 'available' | 'unavailable' | 'travel' | 'sick' | 'suspended'

export interface Member {
  id: string
  first_name: string
  last_name: string
  full_name: string
  phone?: string
  email?: string
  gender: 'male' | 'female'
  profession?: string
  joined_at?: string
  is_active: boolean
  availability_status: MemberAvailabilityStatus
  absence_frequency: number
  priority_score: number
  photo_url?: string
  dahira: Dahira
  house?: House
  category?: MemberCategory
}

export interface House {
  id: string
  label?: string
  address: string
  neighborhood?: string
  capacity: number
  is_available: boolean
  is_headquarters: boolean
  min_interval_weeks: number
  total_received: number
  last_received_at?: string
}

export type RotationStatus =
  | 'planned' | 'confirmed' | 'ongoing' | 'completed'
  | 'cancelled' | 'rescheduled' | 'headquarters'

export type CascadeMode = 'HEADQUARTERS' | 'CHAIN' | 'SWAP' | 'GAP' | 'FILL' | 'INSERT' | 'REPLACE'

export type RotationMotif =
  | 'ABSENCE' | 'SICKNESS' | 'TRAVEL' | 'DEATH' | 'WEDDING'
  | 'RAMADAN' | 'MAGAL' | 'GAMOU' | 'RELIGIOUS_EVENT'
  | 'FLOOD' | 'LOGISTICS' | 'PLANNING_ERROR' | 'REBALANCE' | 'OTHER'

export interface CascadePreviewItem {
  rotation_id: string
  member_name?: string
  house_label?: string
  old_date: string
  new_date: string
  is_locked: boolean
}

export interface CascadePreview {
  items: CascadePreviewItem[]
  meta: { mode: string; total_affected: number; locked_skipped: number; shift_weeks?: number }
  has_locked_warning: boolean
}

export interface CascadeResult {
  applied_count: number
  skipped_locked: number
  headquarters_rotation?: Rotation
  rotations: Rotation[]
}

export interface Rotation {
  id: string
  scheduled_date: string
  status: RotationStatus
  attendees_count?: number
  notes?: string
  house: House
  member?: Member
  assignments: Assignment[]
}

export interface Contribution {
  id: string
  type: 'cotisation' | 'adiya' | 'don' | 'autre'
  amount: number
  paid_at: string
  period?: string
  status: 'pending' | 'paid' | 'partial'
  member: Member
}

export interface Expense {
  id: string
  label: string
  category: string
  amount: number
  spent_at: string
  notes?: string
}

export interface Assignment {
  id: string
  task: string
  completed: boolean
  member: Member
  rotation: Rotation
}
