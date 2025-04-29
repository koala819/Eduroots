import {AttendanceDocument} from '@/types/mongoose'
import {rootOptions, rootSchema} from './root.model'
import {Model, Schema, model, models} from 'mongoose'

const attendanceNEWSchema = new Schema(
  {
    ...rootSchema.obj,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'courseNEW',
      required: true,
    },
    date: {type: Date, required: true},
    records: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: 'userNEW',
          required: true,
        },
        isPresent: {type: Boolean, required: true},
        comment: String,
      },
    ],
    stats: {
      presenceRate: {type: Number, default: 0},
      totalStudents: {type: Number, default: 0},
      lastUpdate: {type: Date, default: Date.now},
    },
  },
  rootOptions,
)

attendanceNEWSchema.index({course: 1, date: 1})
attendanceNEWSchema.index({'records.student': 1})
// Utile pour les rapports d'assiduité sur une période
attendanceNEWSchema.index({date: 1})
// Nouvel index pour le soft delete
attendanceNEWSchema.index({isActive: 1, deletedAt: 1})

// Calcule automatiquement le pourcentage de présence pour une session
attendanceNEWSchema.virtual('presenceRate').get(function () {
  if (!this.records || this.records.length === 0) return 0
  const presentCount = this.records.filter((r) => r.isPresent).length
  return (presentCount / this.records.length) * 100
})

// Utile pour les statistiques rapides
attendanceNEWSchema.virtual('totalStudents').get(function () {
  return this.records?.length || 0
})

// Empêche la création de fiches de présence dans le futur
attendanceNEWSchema.pre('save', function (next) {
  if (this.date > new Date()) {
    next(new Error('La date de présence ne peut pas être dans le futur'))
  }
  next()
})

const modelName = 'AttendanceNEW'
export const Attendance = (models[modelName] ||
  model(modelName, attendanceNEWSchema)) as Model<AttendanceDocument>
