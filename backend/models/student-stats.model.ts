import { SubjectNameEnum } from '@/types/course'

import { rootOptions, rootSchema } from './root.model'

import { Schema, model, models } from 'mongoose'

// Définition du schéma pour les statistiques des étudiants
const studentStatsSchema = new Schema(
  {
    ...rootSchema.obj,
    userId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Student',
    },
    absencesRate: { type: Number, default: 0, min: 0, max: 100 },
    absencesCount: { type: Number, default: 0, min: 0 },
    absences: [
      {
        date: { type: Date, required: true },
        course: {
          type: Schema.Types.ObjectId,
          ref: 'courseNEW',
          required: true,
        },
        reason: { type: String, default: '' },
      },
    ],
    behaviorAverage: { type: Number, default: 0, min: 0, max: 5 },
    grades: {
      [SubjectNameEnum.Arabe]: {
        average: { type: Number, default: 0, min: 0, max: 20 },
      },
      [SubjectNameEnum.EducationCulturelle]: {
        average: { type: Number, default: 0, min: 0, max: 20 },
      },
      overallAverage: { type: Number, default: 0, min: 0, max: 20 },
    },
    lastActivity: { type: Date, default: null },
    lastUpdate: { type: Date, default: Date.now },
  },
  rootOptions,
)

studentStatsSchema.index({ lastUpdate: -1 })
studentStatsSchema.index({ userId: 1 }, { unique: true })
studentStatsSchema.index({ absencesCount: 1 }) // Index pour faciliter les requêtes sur le nombre d'absences

// Création du modèle
const modelName = 'StudentStats'
export const StudentStats =
  models[modelName] || model(modelName, studentStatsSchema)
