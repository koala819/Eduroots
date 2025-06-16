import { Database } from './db'
import { TimeSlotEnum } from './courses'

export type CreateCoursePayload = Database['education']['Tables']['courses']['Insert'] & {
  teacherIds: string[]
  sessions: Array<{
    subject: string
    level: string
    timeSlots: Array<{
      day_of_week: TimeSlotEnum
      start_time: string
      end_time: string
      classroom_number: string | null
    }>
  }>
}

export interface UpdateCoursePayload {
  sessions: Array<{
    id: string
    subject: string
    level: string
    timeSlot: {
      day_of_week: TimeSlotEnum
      start_time: string
      end_time: string
      classroom_number: string | null
    }
  }>
}

export interface AddStudentToCoursePayload {
  courseId: string
  studentId: string
  timeSlot: {
    day_of_week: TimeSlotEnum
    start_time: string
    end_time: string
    subject: string
  }
}

export interface UpdateCourseSessionPayload {
  courseId: string
  sessionIndex: number
  sessionData: Partial<Database['education']['Tables']['courses_sessions']['Row']>
  role: string
  userId: string
}
