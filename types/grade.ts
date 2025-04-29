import {Course} from './course'
import {RootEntity} from './root'
import {Student} from './user'

export enum GradeTypeEnum {
  Controle = 'contrôle',
  Examen = 'examen',
  Devoir = 'devoir',
}

export interface GradeRecord {
  student: string
  value: number // Between 0 and 20
  isAbsent: boolean
  comment?: string
}

export interface GradeVirtuals {
  classAverage: number
  standardDeviation: number
}

export interface Grade extends RootEntity {
  course: Course
  sessionId: string
  date: Date | string
  type: GradeTypeEnum
  records: GradeRecord[]
  isDraft?: boolean
  stats: GradeStats
}

export interface PopulatedGrade extends Omit<Grade, 'records'> {
  records: (Omit<GradeRecord, 'student'> & {
    student: Student
  })[]
}

// DTO(Data Transfer Objects)  pour les opérations API
export interface CreateGradeDTO {
  course: string // Course ID
  sessionId: string
  date: Date
  type: GradeTypeEnum
  isDraft?: boolean
  records: {
    student: string // Student ID
    value: number
    isAbsent: boolean
    comment?: string
  }[]
}

export type UpdateGradeDTO = Partial<CreateGradeDTO>

export interface PopulatedGradeRecord extends Omit<GradeRecord, 'student'> {
  student: Student
}

export interface GradeStats {
  averageGrade: number
  highestGrade: number
  lowestGrade: number
  absentCount: number
  totalStudents: number
}
