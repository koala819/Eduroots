import { BehaviorDocument } from '@/types/mongo/mongoose'

import { rootOptions, rootSchema } from './root.model'

import { Model, Schema, model, models } from 'mongoose'

const behaviorNEWSchema = new Schema(
  {
    ...rootSchema.obj,
    course: {
      type: Schema.Types.ObjectId,
      ref: 'courseNEW',
      required: true,
    },
    date: { type: Date, required: true },
    records: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: 'userNEW',
          required: true,
        },
        rating: {
          type: Number,
          required: true,
          min: 1,
          max: 5,
          validate: {
            validator: (v: number) => Number.isInteger(v),
            message: 'La note doit être un nombre entier',
          },
        },
        comment: String,
      },
    ],
    stats: {
      behaviorRate: { type: Number, default: 0 },
      totalStudents: { type: Number, default: 0 },
      lastUpdate: { type: Date, default: Date.now },
    },
  },
  rootOptions,
)
behaviorNEWSchema.index({ student: 1, course: 1 })
behaviorNEWSchema.index({ teacher: 1, date: 1 })
behaviorNEWSchema.index({ course: 1, date: 1 })
behaviorNEWSchema.index({ 'records.student': 1 })
behaviorNEWSchema.index({ 'records.student': 1, date: 1 })
behaviorNEWSchema.index({ date: -1 })
behaviorNEWSchema.index({ deletedAt: 1 }) // Pour filtrer les éléments non supprimés

behaviorNEWSchema.virtual('averageRating').get(function () {
  if (!this.records || this.records.length === 0) return 0
  const sum = this.records.reduce(
    (acc: number, record: { rating: number }) => acc + record.rating, 0)
  return Math.round((sum / this.records.length) * 100) / 100
})

behaviorNEWSchema.virtual('studentCount').get(function () {
  return this.records ? this.records.length : 0
})

behaviorNEWSchema.virtual('hasComments').get(function () {
  return this.records.some(
    (record: any) => record.comment && record.comment.trim().length > 0,
  )
})

// Ajouter les virtuals lors de la transformation en JSON
behaviorNEWSchema.set('toJSON', {
  virtuals: true,
  transform: function (doc, ret) {
    ret.id = ret._id
    delete ret._id
    delete ret.__v
    return ret
  },
})

behaviorNEWSchema.set('toObject', { virtuals: true })

const modelName = 'behaviorNEW'
export const Behavior = (models[modelName] ||
  model(modelName, behaviorNEWSchema)) as Model<BehaviorDocument>
