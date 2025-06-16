import { Database } from './db'

export type CreateGradePayload = Database['education']['Tables']['grades']['Insert'] & {
  records: Array<{
    student_id: string
    value: number | null
    is_absent: boolean
    comment: string | null
  }>
}

export type GradeStats = {
  stats_average_grade: number
  stats_highest_grade: number
  stats_lowest_grade: number
  stats_absent_count: number
  stats_total_students: number
}
