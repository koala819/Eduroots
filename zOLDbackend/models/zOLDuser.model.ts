import { SubjectNameEnum } from '@/types/mongo/course'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/mongo/user'

import { rootOptions } from './root.model'

import { StudentStats } from '@/backend/models/student-stats.model'
import { TeacherStats } from '@/backend/models/teacher-stats.model'
import bcrypt from 'bcryptjs'
import mongoose, { Schema } from 'mongoose'

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    hasInvalidEmail: { type: Boolean, default: false },
    secondaryEmail: String,
    firstname: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => {
        if (!value) return value
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
      },
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
      set: (value: string) => {
        if (!value) return value
        return value.toUpperCase()
      },
    },
    password: {
      type: String,
      required: true,
      select: false,
    },
    role: {
      type: String,
      enum: Object.values(UserRoleEnum),
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: null,
    },

    // Champs spécifiques aux étudiants
    dateOfBirth: Date,
    gender: {
      type: String,
      enum: Object.values(GenderEnum),
    },
    type: {
      type: String,
      enum: Object.values(UserType),
    },

    // Champs spécifiques aux professeurs
    // On garde subjects uniquement pour les professeurs
    subjects: [
      {
        type: String,
        enum: Object.values(SubjectNameEnum),
      },
    ],

    // Champs communs
    schoolYear: String,
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
    stats: {
      type: Schema.Types.ObjectId,
      refPath: 'statsModel', // Référence dynamique basée sur le champ statsModel
    },
    statsModel: {
      type: String,
      enum: ['StudentStats', 'TeacherStats'],
    },
  },
  {
    ...rootOptions,
    timestamps: true,
  },
)

// Password hashing
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

// Définir le modèle de stats basé sur le rôle
userSchema.pre('save', function (next) {
  if (this.role === 'student') {
    this.statsModel = 'StudentStats'
  } else {
    this.statsModel = 'TeacherStats'
  }
  next()
})

// Create stats for users
userSchema.pre('save', async function (next) {
  // Vérifier si c'est un professeur et qu'il n'a pas de stats
  if (this.role === 'teacher' && !this.stats) {
    try {
      const newStatsDoc = new TeacherStats({
        userId: this._id,
        type: 'teacher',
        teacherStats: {
          totalStudents: 0,
          genderDistribution: {
            counts: {
              [GenderEnum.Masculin]: 0,
              [GenderEnum.Feminin]: 0,
              undefined: 0,
            },
            percentages: {
              [GenderEnum.Masculin]: '0',
              [GenderEnum.Feminin]: '0',
              undefined: '0',
            },
          },
          minAge: 0,
          maxAge: 0,
          averageAge: 0,
        },
        lastUpdate: new Date(),
      })

      await newStatsDoc.save()

      // Ajouter la référence au document de stats
      this.stats = newStatsDoc._id
    } catch (error) {
      console.error('Erreur lors de la création des stats:', error)
    }
  } else if (this.role === 'student' && !this.stats) {
    try {
      const newStatsDoc = new StudentStats({
        userId: this._id,
        type: 'student',
        studentStats: {
          attendanceRate: 0,
          totalAbsences: 0,
          totalSessions: 0,
          lastAttendance: null,
          lastSession: null,
          behaviorAverage: 0,
          lastBehavior: null,
        },
        lastUpdate: new Date(),
      })

      await newStatsDoc.save()

      // Ajouter la référence au document de stats
      this.stats = newStatsDoc._id
    } catch (error) {
      console.error('Erreur lors de la création des stats:', error)
    }
  }
  next()
})

// Indexes
userSchema.index({ email: 1 })
userSchema.index({ role: 1, isActive: 1 })
userSchema.index({ firstname: 1, lastname: 1 })
userSchema.index({ role: 1, subjects: 1 }) // Index pour la recherche des profs par matière

export const User =
  mongoose.models.userNEW || mongoose.model('userNEW', userSchema)
