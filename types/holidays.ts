export interface Holiday {
  id: string
  updated_by: string | null
  created_at: Date
  updated_at: Date
  start_date: Date
  end_date: Date
  is_active: boolean
  academic_year: string
  name: string
  type: 'REGULAR' | 'SPECIAL'
}
