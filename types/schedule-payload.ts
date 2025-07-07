
export type SaveSchedulePayload = {
  updatedBy: string
  [key: string]: any // pour les daySchedules
}

export type ScheduleResponse = {
  academic_year: string
  day_schedules: Record<string, any>
  is_active: boolean
  updated_by: string
  updated_at: string
}
