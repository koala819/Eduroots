import { User } from './db'
import { UserRoleEnum, UserType } from './user'

export type CreateStudentPayload = Omit<User, 'id' | 'auth_id' | 'created_at' | 'updated_at'> & {
  password: string
  role: UserRoleEnum.Student
  type: UserType
}

export type UpdateStudentPayload =
  Partial<Omit<User, 'id' | 'auth_id' | 'created_at' | 'updated_at'>>

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
  'school_year'
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
