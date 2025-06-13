export interface TimeSlot {
  day_of_week: TimeSlotEnum
  start_time: string // Format HH:mm
  end_time: string // Format HH:mm
  classroom_number: string | null
}

export enum TimeSlotEnum {
  SATURDAY_MORNING = 'saturday_morning',
  SATURDAY_AFTERNOON = 'saturday_afternoon',
  SUNDAY_MORNING = 'sunday_morning',
}
