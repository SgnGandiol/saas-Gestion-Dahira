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
  is_family_head: boolean
  family?: Family
  dahira: Dahira
}

export interface Family {
  id: string
  name: string
  address?: string
  neighborhood?: string
  phone?: string
  capacity: number
  is_available: boolean
  total_received: number
  last_received_at?: string
  members: Member[]
  house?: House
}

export interface House {
  id: string
  label?: string
  address: string
  neighborhood?: string
  capacity: number
  is_available: boolean
  min_interval_weeks: number
  family: Family
}

export interface Rotation {
  id: string
  scheduled_date: string
  status: 'planned' | 'confirmed' | 'done' | 'cancelled'
  attendees_count?: number
  notes?: string
  house: House
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
