import { CourseDocument, StudentDocument } from '@/types/mongoose'

import { RootEntity } from './root'
import { Student, Teacher } from './user'

import { Types } from 'mongoose'

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

export enum TimeSlotEnum {
  SATURDAY_MORNING = 'saturday_morning',
  SATURDAY_AFTERNOON = 'saturday_afternoon',
  SUNDAY_MORNING = 'sunday_morning',
}

export const enum TimeEnum {
  MorningStart = '09:00',
  MorningPause = '10:45',
  MorningEnd = '12:30',
  AfternoonStart = '14:00',
  AfternoonPause = '15:45',
  AfternoonEnd = '17:30',
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

export interface TimeSlot {
  dayOfWeek: TimeSlotEnum
  startTime: string // Format HH:mm
  endTime: string // Format HH:mm
  classroomNumber: number
}

export interface CourseSession {
  id: string
  _id?: string
  sessionId?: string
  timeSlot: TimeSlot
  subject: SubjectNameEnum
  level: LevelEnum
  students: Student[]
  user?: {
    id?: string
    role?: string
    firstname?: string
    lastname?: string
  }
  sameStudents?: boolean
  stats: {
    averageGrade?: number
    averageAttendance?: number
    averageBehavior?: number
    lastUpdated?: string | Date
  }
}

export interface CourseStats {
  averageAttendance?: number
  averageGrade?: number
  averageBehavior?: number
  studentCount?: number
  sessionCount?: number
  lastUpdated: Date
}

export interface CourseVirtuals {
  currentStudentCount: number
  isActive: boolean
}

export interface Course extends RootEntity {
  teacher: Array<Types.ObjectId | {_id: Types.ObjectId} | string>
  sessions: CourseSession[]
  academicYear: string
  stats: CourseStats
}

export interface PopulatedCourse extends Omit<Course, 'teacher' | 'sessions'> {
  _id: Types.ObjectId
  teacher: Teacher
  sessions: (Omit<CourseSession, 'students'> & {
    students: Student[]
    user?: {
      id?: string
      role?: string
    }
  })[]
  hasOverlap?: boolean
}

export interface CourseSessionModel extends Omit<CourseSession, 'students'> {
  students: Types.ObjectId[] // Dans le modèle, ce sont des références
}

export interface GroupedStudents {
  courseId: string
  academicYear: string
  sessions: CourseSession[]
}

// For TeacherContext
export interface StudentWithCourses {
  student: StudentDocument
  courses: CourseDocument[]
}

// For groupStudentsByCourse
export interface StudentDataWithCourses {
  studentInfo: Student
  courses: CourseDocument[]
}
