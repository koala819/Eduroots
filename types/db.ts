export type Course = {
  id: number
  is_active: boolean
  deleted_at: string | null
  created_at: string
  updated_at: string
  academic_year: string
}

export type CourseSession = {
  id: number
  course_id: number
  time_slot_id: number
  created_at: string
  updated_at: string
  same_students: boolean
  stats_average_attendance: number | null
  stats_average_grade: number | null
  stats_average_behavior: number | null
  stats_last_updated: string
  subject: string
  level: string
}

export type CourseTeacher = {
  course_id: number
  teacher_id: number
  created_at: string
}

export type Holiday = {
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

export type StatsStudent = {
  id: string
  user_id: string
  absences_rate: number
  absences_count: number
  behavior_average: number
  last_activity: Date | null
  last_update: Date
  created_at: Date
  updated_at: Date
}

export type StatsStudentAbsence = {
  id: string
  student_stats_id: string
  date: Date
  course_id: string
  reason: string
  created_at: Date
  updated_at: Date
}

export type StatsStudentGrade = {
  id: string
  student_stats_id: string
  subject: string
  average: number
  created_at: Date
  updated_at: Date
}

export type User = {
  id: string
  firstname: string
  lastname: string
  email: string
  secondaryEmail: string | null
  is_active: boolean
  deleted_at: Date | null
  date_of_birth: Date | null
  gender: string | null
  type: string | null
  subjects: string[] | null
  school_year: string | null
  stats_model: string | null
  student_stats_id: number | null
  teacher_stats_id: number | null
  role: string
  phone: string | null
  created_at: Date | null
  updated_at: Date | null
  hasInvalidEmail: boolean
}



export type Database = {
  public: {
    Tables: {
      courses: {
        Row: Course
        Insert: Omit<Course, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Course, 'id' | 'created_at' | 'updated_at'>>
      }
      course_sessions: {
        Row: CourseSession
        Insert: Omit<CourseSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CourseSession, 'id' | 'created_at' | 'updated_at'>>
      }
      course_teachers: {
        Row: CourseTeacher
        Insert: Omit<CourseTeacher, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CourseTeacher, 'id' | 'created_at' | 'updated_at'>>
      }
      holidays: {
        Row: Holiday
        Insert: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>
      }
      student_stats: {
        Row: StatsStudent
        Insert: Omit<StatsStudent, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StatsStudent, 'id' | 'created_at' | 'updated_at'>>
      }
       student_stats_absences: {
        Row: StatsStudentAbsence
        Insert: Omit<StatsStudentAbsence, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StatsStudentAbsence, 'id' | 'created_at' | 'updated_at'>>
      }
      student_stats_grades: {
        Row: StatsStudentGrade
        Insert: Omit<StatsStudentGrade, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<StatsStudentGrade, 'id' | 'created_at' | 'updated_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
