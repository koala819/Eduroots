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
