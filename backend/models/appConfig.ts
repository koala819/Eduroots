import {AppConfigDocument, ThemeConfig} from '@/types/models'

import bcrypt from 'bcryptjs'
import {Schema, model, models} from 'mongoose'

const themeSchema = new Schema<ThemeConfig>(
  {
    // cardHeaderGradient: {
    //   type: Map,
    //   of: String,
    // },
    buttonVariants: {
      type: Map,
      of: String,
    },
    cardHeader: String,
    loader: String,
    // loaders: {
    //   type: Schema.Types.Mixed,
    //   // type: Map,
    //   // of: String,
    // },
  },
  {_id: false, strict: false},
)

const appConfigSchema = new Schema<AppConfigDocument>(
  {
    studentPassword: {
      type: String,
      required: true,
      select: false,
    },
    academicYearStart: {
      type: Date,
      required: true,
      get: function (v: Date) {
        return v.toISOString().split('T')[0]
      },
      set: function (v: string) {
        return new Date(v)
      },
    },
    teacherPassword: {
      type: String,
      required: true,
      select: false,
    },
    themes: {
      teacher: themeSchema,
      student: themeSchema,
      bureau: themeSchema,
    },
  },
  {
    timestamps: true,
    toJSON: {getters: true},
    toObject: {getters: true},
  },
)

// Middleware pour hacher les mots de passe avant la sauvegarde
appConfigSchema.pre('save', async function (next) {
  if (this.isModified('studentPassword')) {
    this.studentPassword = await bcrypt.hash(this.studentPassword, 10)
  }
  if (this.isModified('teacherPassword')) {
    this.teacherPassword = await bcrypt.hash(this.teacherPassword, 10)
  }
  next()
})

// Middleware pour hacher les mots de passe lors de la mise à jour
appConfigSchema.pre('findOneAndUpdate', async function (next) {
  const update = this.getUpdate() as Partial<AppConfigDocument>
  if (update.studentPassword) {
    update.studentPassword = await bcrypt.hash(update.studentPassword, 10)
  }
  if (update.teacherPassword) {
    update.teacherPassword = await bcrypt.hash(update.teacherPassword, 10)
  }
  next()
})

export const AppConfig = models?.AppConfig || model<AppConfigDocument>('AppConfig', appConfigSchema)
