import { CourseSession, Database } from './db'

export enum SubjectNameEnum {
  Arabe = 'Arabe',
  EducationCulturelle = 'Education Culturelle',
}

export enum LevelEnum {
  Zero = '0',
  Zero2 = '0-2',
  One = '1',
  One2 = '1-2',
  Two = '2',
  Two2 = '2-2',
  Three = '3',
  Three2 = '3-2',
  Four = '4',
  Four2 = '4-2',
  Five = '5',
  Six = '6',
}

export const enum TimeEnum {
  MorningStart = '09:00',
  MorningPause = '10:45',
  MorningEnd = '12:30',
  AfternoonStart = '14:00',
  AfternoonPause = '15:45',
  AfternoonEnd = '17:30',
}

export enum TimeSlotEnum {
  SATURDAY_MORNING = 'saturday_morning',
  SATURDAY_AFTERNOON = 'saturday_afternoon',
  SUNDAY_MORNING = 'sunday_morning',
}

export interface GroupedStudents {
  courseId: string
  academicYear: string
  sessions: CourseSession[]
}

export interface TimeSlot {
  day_of_week: TimeSlotEnum
  start_time: string // Format HH:mm
  end_time: string // Format HH:mm
  classroom_number: string | null
}

// Interface pour les créneaux horaires du header (classroom)
export interface ClassroomTimeSlot {
  id: string
  subject: string
  dayOfWeek: string
  level: string
  courseId: string
  startTime?: string
  endTime?: string
}

export const TIME_SLOT_SCHEDULE = {
  [TimeSlotEnum.SATURDAY_MORNING]: {
    START: TimeEnum.MorningStart,
    PAUSE: TimeEnum.MorningPause,
    FINISH: TimeEnum.MorningEnd,
  },
  [TimeSlotEnum.SATURDAY_AFTERNOON]: {
    START: TimeEnum.AfternoonStart,
    PAUSE: TimeEnum.AfternoonPause,
    FINISH: TimeEnum.AfternoonEnd,
  },
  [TimeSlotEnum.SUNDAY_MORNING]: {
    START: TimeEnum.MorningStart,
    PAUSE: TimeEnum.MorningPause,
    FINISH: TimeEnum.MorningEnd,
  },
} as const

export type CourseWithRelations = Database['education']['Tables']['courses']['Row'] & {
  courses_teacher: (Database['education']['Tables']['courses_teacher']['Row'] & {
    users: Database['education']['Tables']['users']['Row']
  })[]
  courses_sessions: (Database['education']['Tables']['courses_sessions']['Row'] & {
    courses_sessions_students:
    (
      Database['education']['Tables']['courses_sessions_students']['Row'] &
      { users: Database['education']['Tables']['users']['Row'] }
    )[]
    courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
  })[]
}

export type CourseSessionWithRelations =
  Database['education']['Tables']['courses_sessions']['Row'] & {
    courses_sessions_students:
    (
      Database['education']['Tables']['courses_sessions_students']['Row'] &
      { users: Database['education']['Tables']['users']['Row'] }
    )[]
  courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
}

// Type pour la structure retournée par getCourseSessionById
export type CourseSessionResponse = Database['education']['Tables']['courses_sessions']['Row'] & {
  courses: Database['education']['Tables']['courses']['Row']
  courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
  courses_sessions_students: (
    Database['education']['Tables']['courses_sessions_students']['Row'] & {
      users: Database['education']['Tables']['users']['Row']
    }
  )[]
}

// Fonction utilitaire pour convertir CourseSessionResponse en CourseSessionWithRelations
export function convertToCourseSessionWithRelations(
  response: CourseSessionResponse,
): CourseSessionWithRelations {
  return {
    id: response.id,
    course_id: response.course_id,
    subject: response.subject,
    level: response.level,
    stats_average_attendance: response.stats_average_attendance,
    stats_average_grade: response.stats_average_grade,
    stats_average_behavior: response.stats_average_behavior,
    stats_last_updated: response.stats_last_updated,
    created_at: response.created_at,
    updated_at: response.updated_at,
    courses_sessions_students: response.courses_sessions_students || [],
    courses_sessions_timeslot: response.courses_sessions_timeslot || [],
  }
}

// Type pour les enrollments retournés par getStudentCourses
export type StudentEnrollment =
  Database['education']['Tables']['courses_sessions_students']['Row'] & {
    courses_sessions: Database['education']['Tables']['courses_sessions']['Row'] & {
      // eslint-disable-next-line max-len
      courses_sessions_timeslot: Database['education']['Tables']['courses_sessions_timeslot']['Row'][]
      courses: Database['education']['Tables']['courses']['Row'] & {
        courses_teacher: (
          Database['education']['Tables']['courses_teacher']['Row'] & {
            users: Database['education']['Tables']['users']['Row']
          }
        )[]
      }
    }
  }

// Type pour les sessions transformées d'un étudiant
export type StudentCourseSession = {
  session: {
    id: string
    subject: string
    level: string
    timeSlot: {
      day_of_week: string
      startTime: string
      endTime: string
      classroom_number?: string
    }
  }
  teacher: Database['education']['Tables']['users']['Row']
}

// Type pour un cours avec statistiques complètes et plages horaires
export type CourseWithCompleteTimeRanges = CourseWithRelations & {
  courses_sessions: (CourseWithRelations['courses_sessions'][0] & {
    completeTimeRange?: {
      min_start_time: string
      max_end_time: string
      day_of_week: string
      subjects: Array<{
        subject: string
        level: string
        start_time: string
        end_time: string
      }>
    } | null
  })[]
  timeRanges?: Array<{
    course_id: string
    academic_year: string
    day_of_week: string
    min_start_time: string
    max_end_time: string
    subjects: Array<{
      subject: string
      level: string
      start_time: string
      end_time: string
    }>
  }>
  stats: {
    totalStudents: number
    averageAge: number
    countBoys: number
    countGirls: number
    percentageBoys: number
    percentageGirls: number
  }
}

export interface TimeSlotSelection {
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  subject: SubjectNameEnum
  teacherId: string
}


