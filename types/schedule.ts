import { TimeSlotEnum } from '@/types/courses'

export enum PeriodTypeEnum {
  CLASS = 'CLASS',
  BREAK = 'BREAK',
}

export interface Period {
  startTime: string
  endTime: string
  type: PeriodTypeEnum
  order: number
}

export interface DaySchedule {
  periods: Period[]
}

// Type étendu pour les schedules avec dayType (utilisé dans les props)
export interface DayScheduleWithType {
  dayType: string
  periods: Period[]
}

export type SessionStats = {
  total: number
  male: number
  female: number
  malePercentage: number
  femalePercentage: number
}

export type ScheduleCard = {
  slot: string
  sessionId: string
  teacherName: string
  level: string
  subject: string
  stats: SessionStats
  bgColor: string
  teacherId?: string
  averageAge: number
}

export type ScheduleDay = {
  day: TimeSlotEnum
  dayLabel: string
  slots: {
    slot: string
    cards: ScheduleCard[]
  }[]
}
