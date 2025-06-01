// Dans message.ts
import { SubjectNameEnum, TimeSlotEnum } from './course'
import { Student, Teacher, User } from './user'

interface SessionInfo {
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  classroomNumber: number
}

export interface Session {
  id: string
  label: string
  info: SessionInfo
}

interface CourseInfo {
  courseId: string
  subjects: SubjectNameEnum[]
  studentsBySubject: Record<SubjectNameEnum, Student[]>
}

export interface SessionData {
  sessionInfo: SessionInfo
  courses: CourseInfo[]
}

export interface MessageState {
  recipientType: string | null
  users: User[]
  selectedStudents?: string[]
  selectedSessions: string[]
  email?: string
  teacher: Teacher | null
  loading: boolean
  sessions: Session[]
  studentsBySession: Record<string, SessionData>
}

export type MessageAction =
  | {type: 'SET_RECIPIENT_TYPE'; payload: {type: string; email?: string}}
  | {type: 'SET_USERS'; payload: User[]}
  | {type: 'SET_TEACHER'; payload: Teacher}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_SESSIONS'; payload: any[]}
  | {type: 'SET_STUDENTS_BY_SESSION'; payload: Record<string, any>}
  | {type: 'TOGGLE_STUDENT'; payload: Student}
  | {type: 'REMOVE_USER'; payload: string}
  | {type: 'CLEAR_SELECTION'}
  | {type: 'DESELECT_ALL_IN_SESSION'; payload: string}
  | {type: 'SELECT_ALL_IN_SESSION'; payload: string}
  | {
      type: 'SET_RECIPIENT_TYPE'
      payload: {type: string; email?: string}
    }
  | {type: 'SET_USERS'; payload: User[]}
  | {type: 'SET_TEACHER'; payload: Teacher}
  | {type: 'SET_LOADING'; payload: boolean}
  | {type: 'SET_SESSIONS'; payload: Session[]}
  | {
      type: 'SET_STUDENTS_BY_SESSION'
      payload: Record<string, SessionData>
    }

export interface Message {
  _id: string
  senderId: string
  senderType: string
  recipientId: string[] | string
  recipientType: string[] | string
  subject: string
  message: string
  isRead: boolean
  isSentbox?: boolean
  isDeleted?: {[userId: string]: boolean} | Map<string, boolean>
  attachmentUrl?: string | null
  createdAt?: string | Date
  updatedAt?: string | Date
  parentMessageId?: string | null
  senderName?: string
  receiverName?: string
}

// Ajouter aussi ces types connexes pour plus de cohérence

export interface MessageSender {
  id: string
  type: string
  name: string
}

export interface MessageRecipient {
  id: string
  type: string
  name?: string
  email?: string
}

export interface MessageWithDetails extends Message {
  sender: MessageSender
  recipients: MessageRecipient[]
  formattedDate?: string
  hasAttachment: boolean
}
