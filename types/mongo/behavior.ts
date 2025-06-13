import {Course} from './course'
import {RootEntity} from './root'
import {Student} from './user'

export interface BehaviorRecord extends RootEntity {
  id: string
  student: Student | string
  rating: number // Between 1 and 5
  comment?: string
}

export interface Behavior extends RootEntity {
  course: Course
  date: Date
  records: BehaviorRecord[]
}

export interface DuplicateBehavior {
  course: string
  date: string
  records: {_id: string}[]
}

export interface PopulatedBehavior extends Omit<Behavior, 'records'> {
  records: (Omit<BehaviorRecord, 'student'> & {
    student: Student
  })[]
}

export interface CreateBehaviorPayload {
  course: string
  date: Date | string
  records: {
    student: string
    rating: number
    comment?: string
  }[]
  sessionId: string
}

export interface UpdateBehaviorPayload {
  courseId: string
  date: Date | string
  behaviorId: string
  records: {
    student: string
    rating: number
    comment?: string
  }[]
  sessionId: string
}
