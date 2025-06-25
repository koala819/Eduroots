import { User } from './db'
import { UserRoleEnum } from './user'

export type CreateTeacherPayload = Omit<User,
  'id' |
  'auth_id_email' |
  'auth_id_gmail' |
  'parent2_auth_id_email' |
  'parent2_auth_id_gmail' |
  'created_at' | 'updated_at'> & {
  password: string
  role: UserRoleEnum.Teacher
  subjects: string[]
}

export type UpdateTeacherPayload =
  Partial<Omit<User, 'id' | 'auth_id' | 'created_at' | 'updated_at'>>

export type TeacherResponse = Pick<User,
  'id' |
  'email' |
  'firstname' |
  'lastname' |
  'subjects' |
  'created_at' |
  'updated_at' |
  'type'
>

export type TeacherWithStudentsResponse = TeacherResponse & {
  // Créneaux triés pour le header (optimisation côté serveur)
  timeSlots?: Array<{
    id: string
    subject: string
    dayOfWeek: string
    level: string
    courseId: string
    startTime: string
    endTime: string
  }>
  // Premier créneau par défaut (optimisation côté serveur)
  defaultSessionId?: string | null
  courses: Array<{
    courseId: string
    academicYear: string
    sessions: Array<{
      sessionId: string
      subject: string
      level: string
      timeSlot: string
      startTime?: string
      endTime?: string
      students: Array<{
        id: string
        firstname: string
        lastname: string
        email: string
        secondaryEmail: string | null
        gender: string | null
        dateOfBirth: Date | null
      }>
    }>
  }>
}
