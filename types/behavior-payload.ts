export interface CreateBehaviorPayload {
  course: string
  date: string
  records: {
    student: string
    rating: number
    comment?: string | null
  }[]
  sessionId?: string
}

export interface UpdateBehaviorPayload {
  courseId: string
  behaviorId: string
  date: string
  records: {
    student: string
    rating: number
    comment?: string | null
  }[]
  sessionId: string
}

export interface BehaviorRecordWithRelations {
  behaviors?: {
    id: string
    date: string
    behavior_rate: number
    total_students: number
    last_update: string
    courses_sessions?: {
      id: string
      subject: string
      level: string
      course_id: string
      courses?: {
        id: string
        academic_year: string
      }
    }
  }
}
