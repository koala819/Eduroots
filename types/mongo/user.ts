import { GenderEnum, UserRoleEnum, UserType } from '@/types/supabase/user'
import { SubjectNameEnum } from './course'
import { RootEntity } from './root'

export type User = Student | Teacher | (BaseUser & { role: 'admin' | 'bureau' })

type EmailStatus = 'valid' | 'invalid' | 'pending' | 'bounced'

export interface BaseUser extends RootEntity {
  id: string
  _id: string
  email: string
  firstname: string
  lastname: string
  password: string
  role: UserRoleEnum
  schoolYear?: string
  gender?: GenderEnum
  phone?: string
}

export interface Student extends BaseUser {
  id: string
  role: UserRoleEnum.Student
  type: UserType
  dateOfBirth?: string
  gender?: GenderEnum
  secondaryEmail?: string
  // todo: améliorer interface emailValidation
  // hasInvalidEmail?: EmailStatus
  hasInvalidEmail?: boolean
  // Pour pouvoir suivre quelles matières un étudiant suit ou un enseignant enseigne
  subjects?: SubjectNameEnum[]
  // stats?: {
  //   averageGrade: number
  //   attendanceRate: number
  //   behaviorAverage: number
  //   lastUpdate: Date
  // }
}

export interface Teacher extends BaseUser {
  role: UserRoleEnum.Teacher
  subjects?: SubjectNameEnum[]
  stats?: {
    courseCount: number
    studentCount: number
    averageStudentSuccess: number
    attendanceRate: number
    lastUpdate: Date
  }
  courseRegistrations?: CourseRegistration[]
}

export interface UserVirtuals {
  age: number
  fullName: string
  isAdult: boolean
}

export interface StudentDocument extends Student, UserVirtuals, Document {}

export type StudentSortKeys =
  | 'firstname'
  | 'lastname'
  | 'dateOfBirth'
  | 'gender'
  | 'teacher'
  | 'absences'
  | 'email'

// Interface spécifique pour les étudiants groupés par matière
export interface GroupedStudent extends Student {
  currentSubjects: SubjectNameEnum[]
}

export interface CourseRegistration {
  subject: SubjectNameEnum
  dayOfWeek: string
  startTime: string
  endTime: string
  teacherId: string
}
