import { HolidayScheduleDocument } from '@/types/holidays'

import { Schema, model, models } from 'mongoose'

const HolidaysSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    start: {
      type: Date,
      required: true,
    },
    end: {
      type: Date,
      required: true,
    },
    type: {
      type: String,
      enum: ['REGULAR', 'SPECIAL'],
      required: true,
    },
  },
  { _id: false },
)

const holidaysScheduleSchema = new Schema(
  {
    academicYear: {
      type: String,
      required: true,
    },
    holidays: [HolidaysSchema],
    isActive: {
      type: Boolean,
      default: true,
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: 'userNEW',
      required: true,
    },
  },
  {
    timestamps: true,
  },
)

// Indexes
holidaysScheduleSchema.index({ academicYear: 1, isActive: 1 })
holidaysScheduleSchema.index({ 'holidays.start': 1 })
holidaysScheduleSchema.index({ 'holidays.end': 1 })

export const Holidays =
  models.Holidays ||
  model<HolidayScheduleDocument>('Holidays', holidaysScheduleSchema)
