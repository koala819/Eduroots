import type { CourseSessionWithRelations } from './courses'
import { Grade, GradeRecord, User } from './db'

export enum GradeTypeEnum {
  Controle = 'Controle',
  Devoir = 'Devoir',
  Examen = 'Examen',
}

export type Student = Pick<User, 'id' | 'firstname' | 'lastname'>

export type GradeRecordWithUser = GradeRecord & {
  users: Student
}

export type GradeWithRelations = Grade & {
  courses_sessions: CourseSessionWithRelations
  grades_records: GradeRecordWithUser[]
}
