import { GenderEnum } from '@/types/user'

import { rootOptions, rootSchema } from './root.model'

import { Schema, model, models } from 'mongoose'

// Définition du schéma pour les statistiques des professeurs
const teacherStatsSchema = new Schema(
  {
    ...rootSchema.obj,
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Teacher',
    },
    totalStudents: { type: Number, default: 0 },
    genderDistribution: {
      counts: {
        [GenderEnum.Masculin]: { type: Number, default: 0 },
        [GenderEnum.Feminin]: { type: Number, default: 0 },
        undefined: { type: Number, default: 0 },
      },
      percentages: {
        [GenderEnum.Masculin]: { type: String, default: '0' },
        [GenderEnum.Feminin]: { type: String, default: '0' },
        undefined: { type: String, default: '0' },
      },
    },
    minAge: { type: Number, default: 0 },
    maxAge: { type: Number, default: 0 },
    averageAge: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now },
  },
  rootOptions,
)

teacherStatsSchema.index({ lastUpdate: -1 })
teacherStatsSchema.index({ userId: 1 }, { unique: true })

// Création du modèle
const modelName = 'TeacherStats'

export const TeacherStats =
  models[modelName] || model(modelName, teacherStatsSchema)
