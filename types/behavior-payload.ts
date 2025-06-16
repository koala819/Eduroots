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
