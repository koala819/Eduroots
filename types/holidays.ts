import {Types} from 'mongoose'

export interface Holiday {
  name: string
  start: Date
  end: Date
  type: 'REGULAR' | 'SPECIAL'
}

export interface HolidayScheduleDocument extends Document {
  academicYear: string
  holidays: Holiday[]
  isActive: boolean
  updatedBy: Types.ObjectId
  createdAt: Date
  updatedAt: Date
}
