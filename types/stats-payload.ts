
export type StudentStatsPayload = {
  attendanceRate: number
  totalAbsences: number
  behaviorAverage: number
}

export type TeacherStatsPayload = {
  attendanceRate: number
  totalSessions: number
}

export type GlobalStatsResponse = {
  presenceRate: number
  totalStudents: number
  totalTeachers: number
  lastUpdate: string
}

export type StudentAttendanceResponse = {
  attendanceRate: number
  totalAbsences: number
  lastUpdate: string
}

export type StudentBehaviorResponse = {
  behaviorAverage: number
  totalIncidents: number
  lastUpdate: string
}

export type StudentGradeResponse = {
  grades: Record<string, number>
  average: number
  lastUpdate: string
}
