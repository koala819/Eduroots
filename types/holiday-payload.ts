import { Holiday } from './db'

export interface SaveHolidayPayload {
  updatedBy: string
  holidays: Holiday[]
}

export interface HolidayResponse {
  academic_year: string
  holidays_data: Holiday[]
  is_active: boolean
  updated_by: string
  updated_at: string
}
