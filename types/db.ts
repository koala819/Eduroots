export type Course = {
  id: string
  is_active: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
  academic_year: string
}

export type CourseSession = {
  id: string
  course_id: string
  subject: string
  level: string
  stats_average_attendance: number | null
  stats_average_grade: number | null
  stats_average_behavior: number | null
  stats_last_updated: Date
  created_at: Date
  updated_at: Date
}

export type CourseSessionStudent = {
  id: string
  course_sessions_id: string
  student_id: string
  created_at: Date
}

export type CourseSessionTimeslot = {
  id: string
  course_sessions_id: string
  day_of_week: string
  start_time: string
  end_time: string
  classroom_number: string | null
  created_at: Date
  updated_at: Date
}

export type CourseTeacher = {
  course_id: string
  teacher_id: string
  created_at: Date
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
  course_session_id: string
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

export type TeacherStats = {
  id: string
  is_active: boolean
  user_id: string
  total_students: number
  min_age: number
  max_age: number
  average_age: number
  last_update: Date
  created_at: Date
  updated_at: Date
}

export type TeacherStatsGenderDistribution = {
  id: string
  teacher_stats_id: string
  count_masculin: number
  count_feminin: number
  count_undefined: number
  percentage_masculin: string
  percentage_feminin: string
  percentage_undefined: string
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
  student_stats_id: string | null
  teacher_stats_id: string | null
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
      courses_sessions: {
        Row: CourseSession
        Insert: Omit<CourseSession, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CourseSession, 'id' | 'created_at' | 'updated_at'>>
      }
      courses_sessions_timeslot: {
        Row: CourseSessionTimeslot
        Insert: Omit<CourseSessionTimeslot, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CourseSessionTimeslot, 'id' | 'created_at' | 'updated_at'>>
      }
      courses_sessions_students: {
        Row: CourseSessionStudent
        Insert: Omit<CourseSessionStudent, 'id' | 'created_at'>
        Update: Partial<Omit<CourseSessionStudent, 'id' | 'created_at'>>
      }
      courses_teacher: {
        Row: CourseTeacher
        Insert: Omit<CourseTeacher, 'created_at'>
        Update: Partial<Omit<CourseTeacher, 'created_at'>>
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
      teacher_stats: {
        Row: TeacherStats
        Insert: Omit<TeacherStats, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TeacherStats, 'id' | 'created_at' | 'updated_at'>>
      }
      teacher_gender_distribution: {
        Row: TeacherStatsGenderDistribution
        Insert: Omit<TeacherStatsGenderDistribution, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TeacherStatsGenderDistribution, 'id' | 'created_at' | 'updated_at'>>
      }
      users: {
        Row: User
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>
      }
    }
  }
}
