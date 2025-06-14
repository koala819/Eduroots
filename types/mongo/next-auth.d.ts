import 'next-auth'

import {BaseUser, Student, Teacher} from '@/types/mongo/user'

declare module 'next-auth' {
  interface Session {
    user: (BaseUser | Student | Teacher) & {customToken?: string}
  }
}
