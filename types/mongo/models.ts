import { Document, Model, Schema } from 'mongoose'

export interface AppConfig {
  studentPassword?: string
  academicYearStart: string | Date
  teacherPassword?: string
  themes: {
    teacher: ThemeConfig
    student: ThemeConfig
    bureau: ThemeConfig
  }
}

export interface AppConfigDocument extends AppConfig, Document {
  studentPassword: string
  teacherPassword: string
}

// export interface Attendance {
//   _id: string
//   date: string
//   session: string
//   isNextSession?: boolean
//   warning?: boolean
//   teacher?: string
//   students: {
//     student: { firstname: string; lastname: string; _id: string }
//     isPresent: boolean
//   }[]
//   isMissing?: boolean
// }

// export interface AttendanceRecord {
//   date: string
//   session: string
//   teacher: any
//   students: StudentRecord[]
// }

interface BaseStudentRecord {
  isPresent: boolean
}

export interface OldStudentFormat extends BaseStudentRecord {
  _id: {
    _id: string
    email: string
    firstname: string
    lastname: string
    role: string
    createdAt: string
    teacher: string
    session: string
    __v: number
    behavior: number
  }
}

export interface NewStudentFormat extends BaseStudentRecord {
  _id: string
  email: string
  firstname: string
  lastname: string
  role: string
  createdAt: string
  teacher: string
  session: string
  __v: number
  behavior: number
}

export type StudentRecord = OldStudentFormat | NewStudentFormat

// export interface Behavior {
//   _id: string
//   date: string
//   teacher: string
//   session: string
//   students: {
//     _id: {
//       _id: string
//       firstname: string
//       lastname: string
//     }
//     rating: number
//   }[]
//   warning?: boolean
//   isMissing?: boolean
// }

export interface BehaviorRecord {
  _id: string
  date: string
  teacher: string
  session: string
  students: StudentBehavior[]
  createdAt: string
  updatedAt: string
}

export interface CheckOTPProps {
  email: string
  otp: number | null
  onOTPVerified: () => void
  otpExpirationTime: number
}

export interface CloudinaryStats {
  plan: string
  last_updated: string
  date_requested: string
  storage: {
    usage: number
    credits_usage: number
  }
  bandwidth: {
    usage: number
    credits_usage: number
  }
  transformations: {
    usage: number
    credits_usage: number
  }
  requests: number
  rate_limit_allowed: number
  rate_limit_remaining: number
  rate_limit_reset_at: string
}

export interface Credentials {
  email: string
  password: string
  role: string
}

export interface DuplicateBehavior {
  teacher: string
  session: string
  weekPeriod: string
  behaviors: {_id: string}[]
}

export interface DuplicateRecords {
  teacher: string
  session: string
  weekPeriod: string
  attendances: {_id: string}[]
  behaviors?: {_id: string}[]
}

export interface FormLogin {
  mail: string
  pwd: string
  role: string
}

export interface FormStudent {
  firstname: string
  lastname: string
  mail: string
  teacher: string
  session: string
}

export interface FormTeacher {
  firstname: string
  // gender: string
  lastname: string
  mail: string
  pwd?: string
  session: string[]
}

export interface IMessage extends Document {
  senderId: Schema.Types.ObjectId
  senderType: string
  recipientId: string[]
  recipientType: string
  subject: string
  message: string
  isRead: boolean
  isSentbox: boolean
  isDeleted: Map<string, boolean>
  attachmentUrl?: string
  createdAt: Date
  parentMessageId?: Schema.Types.ObjectId
}

export interface IStudent {
  _id: string
  firstname: string
  lastname: string
}

export interface ITeacher {
  _id: string
  firstname: string
  lastname: string
  role: string
}

export interface Mail {
  _id: string
  senderId: string
  senderType: string
  senderName: string
  recipientId: string
  recipientType: 'teacher' | 'student'
  receiverName: string
  to: string
  subject: string
  message: string
  attachmentUrl: string
  createdAt: string
  date: string
  __v: number
  isRead: boolean
  id: string
  isDeleted?: {[userId: string]: boolean}
  isSentbox: boolean
}

export interface MessageBody {
  senderId: string
  senderType: string
  // recipientInfo: UserDocument[]
  recipientId: string | string[]
  recipientType: string | string[]
  subject: string
  isRead: boolean
  attachmentUrl: string | null
  message: string
  parentMessageId?: string | null
}

export interface MessageContainerProps {
  isSentbox?: boolean
}

export interface MessageModel extends Model<IMessage> {
  encryptFields(message: IMessage): void
  decryptFields(message: IMessage): void
}

export interface MosqueeStats {
  nbStudents: number
  nbTeachers: number
  attendanceRate: number
  behaviorRate: number
  teachersWithAttendance: number
  studentsPresent: number
  totalExpectedStudents: number
  teachersWithoutSession: any[]
  teachersWithoutBehavior: string[]
  teachersWithMultipleAttendance: any[]
  teachersWithoutAttendance: {
    name: string
    missingSessions: [string, string][]
  }[]
}

export interface MyQuillComponentProps {
  value: string
  onChange: (content: string) => void
}

export interface ReceiverName {
  [key: string]: string
  teacher: string
  all: string
  student: string
  default: string
}

export interface RstPwdProps {
  role: 'student' | 'teacher'
}

export type SortKeys =
  | 'firstname'
  | 'lastname'
  | 'dateOfBirth'
  | 'gender'
  | 'teacher'
  | 'absences'
  | 'email'

export interface Stats {
  storageSize: number
  dataSize: number
  freeStorageSize: number
  usedStorageSize: number
}

export interface StudentAbsences {
  _id: string
  absences: number
  color: 'red' | 'orange' | 'green'
}

export interface StudentBehavior {
  _id: string
  rating: number
}

export type ButtonVariant =
  | 'default'
  | 'destructive'
  | 'outline'
  | 'teacherCancel'
  | 'teacherDefault'
  | 'teacherSecondary'
  | 'teacherTertiary'
  | 'teacherWarning'
  | 'studentCancel'
  | 'studentDefault'
  | 'studentSecondary'
  | 'studentTertiary'
  | 'studentWarning'
  | 'bureauCancel'
  | 'bureauDefault'
  | 'bureauSecondary'
  | 'bureauTertiary'
  | 'bureauWarning'

export interface ThemeConfig {
  buttonVariants: Record<ButtonVariant, string>
  cardHeader: string
  loader: string
  [key: string]: any // Pour permettre des propriétés supplémentaires dues à { strict: false }
}

// Type pour le document Mongoose
export interface ThemeConfigDocument extends ThemeConfig, Document {}

interface StudentAbsence {
  _id: {
    _id: string
    email: string
    firstname: string
    lastname: string
    role: string
    createdAt: string
    teacher: string
    session: string[]
    __v: number
  }
  isPresent: boolean
}

export interface StudentAbsenceDetail {
  _id: string
  absences: number
  color: 'red' | 'orange' | 'green'
}

export interface StudentsProps {
  studentId?: string
  title?: string
  description: string
}

export interface StudentWithId {
  id: string
  firstname: string
  lastname: string
}

export interface TeachersProps {
  teacherId?: any
  title: string
  description: string
}

export interface TeacherWithStudents {
  teacher: {
    _id: string
    email: string
    firstname: string
    lastname: string
    role: string
    createdAt: string
    session: string[]
    // gender: string
    __v: number
  }
  students: StudentAbsence[]
}

export type TogglePasswordVisibilityProps = {
  showPwd: boolean
  setShowPwd: React.Dispatch<React.SetStateAction<boolean>>
}

// export type WorkingSession = {
//   _id: string
//   sessionTime: string
//   level: string
// }
