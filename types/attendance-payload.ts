export interface CreateAttendancePayload {
  courseId: string
  date: string
  records: {
    studentId: string
    isPresent: boolean
    comment?: string | null
  }[]
  sessionId?: string
}

export interface UpdateAttendancePayload {
  attendanceId: string
  records: {
    studentId: string
    isPresent: boolean
    comment?: string | null
  }[]
}
