import { User } from './db'
import { UserType } from './user'

export type CreateStudentPayload = Omit<User,
  'id' |
  'auth_id_email' |
  'auth_id_gmail' |
  'parent2_auth_id_email' |
  'parent2_auth_id_gmail' |
  'created_at' |
  'updated_at' |
  'role'> & {
  role: string
  type: UserType
}

export type UpdateStudentPayload =
  Partial<Omit<User,
    'id' |
    'auth_id_email' |
    'auth_id_gmail' |
    'parent2_auth_id_email' |
    'parent2_auth_id_gmail' |
    'created_at' |
    'updated_at'>>

export type StudentResponse = Pick<User,
  'id' |
  'email' |
  'firstname' |
  'lastname' |
  'type' |
  'subjects' |
  'created_at' |
  'updated_at' |
  'gender' |
  'date_of_birth' |
  'secondary_email' |
  'phone' |
  'secondary_phone' |
  'whatsapp_phone' |
  'school_year' |
  'is_active'
>

export type StudentWithTeachersResponse = StudentResponse & {
  teachers: Array<{
    id: string
    email: string
    firstname: string
    lastname: string
    subjects: string[] | null
  }>
}
