export type AppConfig = {
  id: string
  academic_year_start: Date
  created_at: Date
  updated_at: Date
}

export type AppConfigTheme = {
  id: string
  config_id: string
  created_at: Date
  updated_at: Date
  card_header: string | null
  loader: string | null
  user_type: string
  button_variants: string | null
}

export type Attendance = {
  id: string
  course_id: string
  date: Date
  presence_rate: number
  total_students: number
  last_update: Date
  created_at: Date
  updated_at: Date
  is_active: boolean
  deleted_at: Date | null
}

export type AttendanceRecord = {
  id: string
  attendance_id: string
  student_id: string
  is_present: boolean
  comment: string | null
  created_at: Date
  updated_at: Date
}

export type Behavior = {
  id: string
  course_id: string
  date: Date
  behavior_rate: number
  total_students: number
  last_update: Date
  created_at: Date
  updated_at: Date
  is_active: boolean
  deleted_at: Date | null
}

export type BehaviorRecord = {
  id: string
  behavior_id: string
  student_id: string
  rating: number
  comment: string | null
  created_at: Date
  updated_at: Date
}

export type ConnectionLog = {
  id: string
  user_id: string | null
  is_successful: boolean
  timestamp: Date
  created_at: Date
  updated_at: Date
  user_agent: string
  firstname: string | null
  lastname: string | null
  email: string
  role: string
}

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

export type GlobalStats = {
  id: string
  total_students: number
  total_teachers: number
  average_attendance_rate: number
  presence_rate: number
  last_update: Date
  created_at: Date
  updated_at: Date
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

export type ScheduleConfig = {
  id: string
  is_active: boolean
  updated_by: string | null
  academic_year: string
  created_at: Date
  updated_at: Date
}

export type ScheduleDay = {
  id: string
  config_id: string
  start_time: string
  end_time: string
  order_number: number
  day_of_week: string
  type: string
  created_at: Date
  updated_at: Date
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
      app_config: {
        Row: AppConfig
        Insert: Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AppConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      app_config_theme: {
        Row: AppConfigTheme
        Insert: Omit<AppConfigTheme, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AppConfigTheme, 'id' | 'created_at' | 'updated_at'>>
      }
      attendances: {
        Row: Attendance
        Insert: Omit<Attendance, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Attendance, 'id' | 'created_at' | 'updated_at'>>
      }
      attendance_records: {
        Row: AttendanceRecord
        Insert: Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AttendanceRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      behaviors: {
        Row: Behavior
        Insert: Omit<Behavior, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Behavior, 'id' | 'created_at' | 'updated_at'>>
      }
      behavior_records: {
        Row: BehaviorRecord
        Insert: Omit<BehaviorRecord, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<BehaviorRecord, 'id' | 'created_at' | 'updated_at'>>
      }
      connection_logs: {
        Row: ConnectionLog
        Insert: Omit<ConnectionLog, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ConnectionLog, 'id' | 'created_at' | 'updated_at'>>
      }
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
      global_stats: {
        Row: GlobalStats
        Insert: Omit<GlobalStats, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<GlobalStats, 'id' | 'created_at' | 'updated_at'>>
      }
      holidays: {
        Row: Holiday
        Insert: Omit<Holiday, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Holiday, 'id' | 'created_at' | 'updated_at'>>
      }
      schedule_configs: {
        Row: ScheduleConfig
        Insert: Omit<ScheduleConfig, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ScheduleConfig, 'id' | 'created_at' | 'updated_at'>>
      }
      schedule_days: {
        Row: ScheduleDay
        Insert: Omit<ScheduleDay, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ScheduleDay, 'id' | 'created_at' | 'updated_at'>>
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
