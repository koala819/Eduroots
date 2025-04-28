import { rootOptions, rootSchema } from './root.model'

import { Schema, model, models } from 'mongoose'

// Définition du schéma pour les statistiques globales
const globalStatsSchema = new Schema(
  {
    ...rootSchema.obj,
    totalStudents: { type: Number, default: 0 },
    totalTeachers: { type: Number, default: 0 },
    averageAttendanceRate: { type: Number, default: 0 },
    presenceRate: { type: Number, default: 0 },
    lastUpdate: { type: Date, default: Date.now },
  },
  rootOptions,
)

globalStatsSchema.index({ lastUpdate: -1 })

// Création du modèle
const modelName = 'GlobalStats'
export const GlobalStats =
  models[modelName] || model(modelName, globalStatsSchema)
