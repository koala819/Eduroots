import { Course } from './course'
import { RootEntity } from './root'
import { Student } from './user'

export interface AttendanceStats {
  presenceRate: number
  totalStudents: number
  lastUpdate: Date
}

export interface AttendanceRecord extends RootEntity {
  id: string
  student: string | Student // peut être l'ID ou l'objet Student complet
  isPresent: boolean
  comment?: string
}

export interface Attendance extends RootEntity {
  course: string | Course // peut être l'ID ou l'objet Course complet
  date: Date | string
  records: AttendanceRecord[]
  stats?: AttendanceStats
}

// Type pour les données peuplées depuis MongoDB
export interface PopulatedAttendance
  extends Omit<Attendance, 'records' | 'course'> {
  course: Course
  records: (Omit<AttendanceRecord, 'student'> & {
    student: Student
  })[]
}

// Type pour les doublons d'attendance
export interface DuplicateAttendanceRecord {
  _id: string
  course: string
  date: string
  teacher: string
  session: string
  weekPeriod: string
}

export interface DuplicateRecords {
  teacher: string
  session: string
  weekPeriod: string
  attendances: { _id: string }[]
}

export interface AbsenceLevelGroup {
  id: string
  absences: number
  color: string
}

export interface GroupedAbsences {
  [color: string]: AbsenceLevelGroup[]
}

export type OmitRootFields =
  | 'id'
  | 'isActive'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'

export interface CreateAttendancePayload {
  courseId: string
  sessionId: string
  date: Date | string
  records: {
    student: string
    isPresent: boolean
    comment?: string
  }[]
}
export interface UpdateAttendancePayload {
  attendanceId: string
  date: Date | string
  records: {
    student: string
    isPresent: boolean
    comment?: string
  }[]
}
