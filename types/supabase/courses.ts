import { Database } from './db'

export type CourseWithRelations = Database['education']['Tables']['courses']['Row'] & {
  courses_teacher: (Database['education']['Tables']['courses_teacher']['Row'] & {
    users: Database['education']['Tables']['users']['Row']
  })[]
  courses_sessions: (Database['education']['Tables']['courses_sessions']['Row'] & {
    courses_sessions_students: (Database['education']['Tables']['courses_sessions_students']['Row'] & {
      users: Database['education']['Tables']['users']['Row']
    })[]
    courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
  })[]
}

export type CourseSessionWithRelations = Database['education']['Tables']['courses_sessions']['Row'] & {
  courses_sessions_students: (Database['education']['Tables']['courses_sessions_students']['Row'] & {
    users: Database['education']['Tables']['users']['Row']
  })[]
  courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
}

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
