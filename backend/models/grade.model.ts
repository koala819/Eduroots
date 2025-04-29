import {GradeTypeEnum} from '@/types/grade'
import {GradeDocument} from '@/types/mongoose'

import {rootOptions, rootSchema} from './root.model'

import {Model, Schema, model, models} from 'mongoose'

const gradeNEWSchema = new Schema(
  {
    ...rootSchema.obj,
    isDraft: {type: Boolean, default: false},
    course: {
      type: Schema.Types.ObjectId,
      ref: 'courseNEW',
      required: true,
    },
    sessionId: {
      type: String,
      required: true,
    },
    date: {type: Date, required: true},
    type: {
      type: String,
      enum: Object.values(GradeTypeEnum),
      required: true,
    },
    records: [
      {
        student: {
          type: Schema.Types.ObjectId,
          ref: 'userNEW',
          required: true,
        },
        value: {
          type: Number,
          min: 0,
          max: 20,
          // validate: {
          //   validator: (v: number) => Number.isInteger(v),
          //   message: 'La note doit être un nombre entier',
          // },
        },
        isAbsent: {type: Boolean, default: false},
        comment: String,
        migrationContext: {
          type: {
            originalCourse: {type: Schema.Types.ObjectId, ref: 'courseNEW'},
            originalTeacher: {type: Schema.Types.ObjectId, ref: 'userNEW'},
            originalGrade: {type: Schema.Types.ObjectId, ref: 'GradeNEW'},
            migrationReason: String,
          },
          default: null,
        },
      },
    ],
    stats: {
      averageGrade: {type: Number, default: 0}, // moyenne de la note
      highestGrade: {type: Number, default: 0}, // meilleure note
      lowestGrade: {type: Number, default: 20}, // note la plus basse
      absentCount: {type: Number, default: 0}, // nombre d'absents
      totalStudents: {type: Number, default: 0}, // nombre total d'étudiants
    },
  },
  rootOptions,
)

gradeNEWSchema.index({student: 1, sessionId: 1, course: 1})
gradeNEWSchema.index({teacher: 1, date: 1})

const modelName = 'GradeNEW'
export const Grade = (models[modelName] || model(modelName, gradeNEWSchema)) as Model<GradeDocument>
