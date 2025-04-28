import { Document, Model, Types } from 'mongoose'

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

// Interface de base
export interface ScheduleConfig {
  academicYear: string
  daySchedules: Map<string, DaySchedule> // Changed from Record to Map
  isActive: boolean
  updatedBy: Types.ObjectId
  createdAt?: Date // Ajouté car tu as timestamps: true
  updatedAt?: Date // Ajouté car tu as timestamps: true
}

// Interface pour le document Mongoose
export interface ScheduleConfigDocument extends Document, ScheduleConfig {}

// Interface pour le model Mongoose
export interface ScheduleConfigModel extends Model<ScheduleConfigDocument> {}
