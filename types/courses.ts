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



