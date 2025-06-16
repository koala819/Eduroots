import { Attendance, AttendanceRecord } from '@/types/db'

// À ajouter si tu veux tout dans ce fichier :
export interface AttendanceStats {
  totalStudents: number
  presentCount: number
  absentCount: number
  presenceRate: number
  absenceRate: number
  byDate?: {
    [date: string]: {
      present: number
      absent: number
      rate: number
    }
  }
}

export interface GroupedAbsences {
  critical: string[] // étudiants avec > 30% d'absences
  warning: string[] // étudiants avec > 20% d'absences
  normal: string[] // étudiants avec < 20% d'absences
}

export interface DuplicateRecords {
  date: string
  courseId: string
  records: AttendanceRecord[]
}

// L'état du contexte
export interface AttendanceState {
  attendanceRecords: AttendanceRecord[]
  duplicateAttendanceEntries: DuplicateRecords[]
  error: string | null
  isLoading: boolean
  isLoadingAttendance: boolean
  registeredStudentIds: string[]
  studentsByAbsenceLevel: GroupedAbsences
  stats: AttendanceStats | null
  deletedRecords: AttendanceRecord[]
  allAttendance: Attendance[] | null
  checkOneAttendance: Attendance | null
  todayAttendance: Attendance | null
}
