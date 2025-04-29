import 'next-auth'

import {BaseUser, Student, Teacher} from '@/types/user'

declare module 'next-auth' {
  interface Session {
    user: BaseUser | Student | Teacher
  }
}
