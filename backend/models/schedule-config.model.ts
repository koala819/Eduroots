import {ScheduleConfigDocument, ScheduleConfigModel} from '@/types/mongoose'
import {PeriodTypeEnum} from '@/types/schedule'

import {Schema, model, models} from 'mongoose'

const periodSchema = new Schema(
  {
    startTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: "Le format de l'heure doit être HH:MM",
      },
    },
    endTime: {
      type: String,
      required: true,
      validate: {
        validator: (v: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v),
        message: "Le format de l'heure doit être HH:MM",
      },
    },
    type: {
      type: String,
      enum: Object.values(PeriodTypeEnum),
      required: true,
    },
    order: {
      type: Number,
      required: true,
    },
  },
  {_id: false},
)

const dayScheduleSchema = new Schema(
  {
    periods: [periodSchema],
  },
  {_id: false},
)

const scheduleConfigSchema = new Schema(
  {
    academicYear: {
      type: String,
      required: true,
    },
    daySchedules: {
      type: Map,
      of: dayScheduleSchema,
      default: {},
    },
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
scheduleConfigSchema.index({academicYear: 1, isActive: 1})
scheduleConfigSchema.index({'daySchedules.periods.startTime': 1})
scheduleConfigSchema.index({'daySchedules.periods.endTime': 1})

export const ScheduleConfig: ScheduleConfigModel =
  (models.ScheduleConfig as ScheduleConfigModel) ||
  model<ScheduleConfigDocument, ScheduleConfigModel>('ScheduleConfig', scheduleConfigSchema)
