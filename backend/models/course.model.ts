import { LevelEnum, SubjectNameEnum, TimeSlotEnum } from '@/types/course'
import { CourseDocument } from '@/types/mongoose'

import { rootOptions, rootSchema } from './root.model'

import { Model, Schema, model, models } from 'mongoose'

const timeSlotSchema = new Schema(
  {
    dayOfWeek: {
      type: String,
      enum: Object.values(TimeSlotEnum),
      required: true,
    },
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
    classroomNumber: { type: Number, required: true },
  },
  { _id: false },
)

const courseSessionSchema = new Schema(
  {
    timeSlot: { type: timeSlotSchema, required: true },
    subject: {
      type: String,
      enum: Object.values(SubjectNameEnum),
      required: true,
    },

    level: {
      type: String,
      enum: Object.values(LevelEnum),
      required: true,
    },
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: 'userNEW',
      },
    ],
    sameStudents: Boolean,
    stats: {
      averageAttendance: Number,
      averageGrade: Number,
      averageBehavior: Number,
      lastUpdated: { type: Date, default: Date.now },
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  },
)

const courseNEWSchema = new Schema<CourseDocument>(
  {
    ...rootSchema.obj,
    teacher: [
      {
        type: Schema.Types.ObjectId,
        ref: 'userNEW',
        required: true,
      },
    ],
    sessions: [courseSessionSchema],
    academicYear: {
      type: String,
      required: true,
    },
  },
  rootOptions,
)

// Cela signifie "trouve-moi rapidement tous les cours d'un professeur pour une année donnée".
courseNEWSchema.index({ teacher: 1, academicYear: 1 })
courseNEWSchema.index({ 'sessions.students': 1 })
courseNEWSchema.index({ isActive: 1 })
courseNEWSchema.index({
  'sessions.timeSlot.dayOfWeek': 1,
  'sessions.timeSlot.startTime': 1,
})
courseNEWSchema.index({ 'sessions.timeSlot.classroomNumber': 1 })
courseNEWSchema.index({ academicYear: 1, isActive: 1 })
courseNEWSchema.index({ 'sessions.stats.lastUpdated': 1 })

// Hook pour mettre à jour les stats
// courseNEWSchema.pre('save', async function (next) {
//   try {
//     // Calcul de la moyenne des présences
//     const attendances = await Attendance.find({ course: this._id })
//     if (attendances.length > 0) {
//       const presenceCount = attendances.reduce(
//         (sum, att) =>
//           sum +
//           att.records.filter((r: { isPresent: boolean }) => r.isPresent).length,
//         0,
//       )
//       const totalRecords = attendances.reduce(
//         (sum, att) => sum + att.records.length,
//         0,
//       )
//       if (this.stats) {
//         this.stats.averageAttendance = (presenceCount / totalRecords) * 100
//       }
//     }

//     // Calcul de la moyenne des notes
//     const grades = await Grade.find({ course: this._id })
//     if (grades.length > 0) {
//       const validGrades = grades.reduce(
//         (arr, grade) => [
//           ...arr,
//           ...grade.records
//             .filter((r: { isAbsent: boolean }) => !r.isAbsent)
//             .map((r: { value: number }) => r.value),
//         ],
//         [],
//       )
//       const sum = validGrades.reduce((a: number, b: number) => a + b, 0)
//       if (this.stats) {
//         this.stats.averageGrade = sum / validGrades.length
//       }
//     }
//     if (this.stats) {
//       this.stats.lastUpdated = new Date()
//     }
//     next()
//   } catch (error: any) {
//     next(error)
//   }
// })

// courseSessionSchema.pre('save', async function (next) {
//   try {
//     const courseModel = this.model('Course')
//     const parentDoc = this.$parent()

//     if (!parentDoc) {
//       throw new Error('Parent document not found')
//     }

//     // Vérification des conflits pour le professeur
//     const teacherConflicts = await courseModel.find({
//       _id: { $ne: parentDoc._id },
//       'sessions.timeSlot.dayOfWeek': this.timeSlot.dayOfWeek,
//       'sessions.timeSlot.startTime': { $lt: this.timeSlot.endTime },
//       'sessions.timeSlot.endTime': { $gt: this.timeSlot.startTime },
//       teacher: parentDoc.get('teacher'),
//       isActive: true,
//     })

//     if (teacherConflicts.length > 0) {
//       throw new Error('Le professeur a déjà un cours programmé sur ce créneau')
//     }

//     // 2. Vérification des conflits de salle
//     const roomConflicts = await courseModel.find({
//       _id: { $ne: parentDoc._id },
//       'sessions.timeSlot.dayOfWeek': this.timeSlot.dayOfWeek,
//       'sessions.timeSlot.startTime': { $lt: this.timeSlot.endTime },
//       'sessions.timeSlot.endTime': { $gt: this.timeSlot.startTime },
//       'sessions.timeSlot.classroomNumber': this.timeSlot.classroomNumber,
//       isActive: true,
//     })

//     if (roomConflicts.length > 0) {
//       throw new Error(
//         `La salle ${this.timeSlot.classroomNumber} est déjà occupée sur ce créneau`,
//       )
//     }

//     // Vérification des conflits pour les étudiants
//     if (this.students && this.students.length > 0) {
//       const studentConflicts = await courseModel.find({
//         _id: { $ne: parentDoc._id },
//         'sessions.timeSlot.dayOfWeek': this.timeSlot.dayOfWeek,
//         'sessions.timeSlot.startTime': { $lt: this.timeSlot.endTime },
//         'sessions.timeSlot.endTime': { $gt: this.timeSlot.startTime },
//         'sessions.students': { $in: this.students },
//         isActive: true,
//       })

//       if (studentConflicts.length > 0) {
//         throw new Error(
//           'Un ou plusieurs étudiants ont déjà un cours sur ce créneau',
//         )
//       }
//     }

//     // Validation des horaires
//     const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/
//     if (
//       !timeRegex.test(this.timeSlot.startTime) ||
//       !timeRegex.test(this.timeSlot.endTime)
//     ) {
//       throw new Error("Format d'heure invalide. Utilisez le format HH:mm")
//     }

//     if (this.timeSlot.startTime >= this.timeSlot.endTime) {
//       throw new Error("L'heure de fin doit être postérieure à l'heure de début")
//     }

//     next()
//   } catch (error: any) {
//     next(error)
//   }
// })

// courseNEWSchema.methods.updateStats = async function (this: CourseDocument) {
//   const stats = {
//     averageAttendance: this.stats?.averageAttendance,
//     averageGrade: this.stats?.averageGrade,
//     studentCount: 0,
//     sessionCount: this.sessions.length,
//     lastUpdated: new Date(),
//   }

//   const uniqueStudents = new Set(
//     this.sessions.flatMap((session: CourseSession) =>
//       session.students.map((sid) => sid.toString()),
//     ),
//   )
//   stats.studentCount = uniqueStudents.size

//   await this.updateOne({ stats })
// }

// courseNEWSchema.virtual('currentStudentCount').get(function (
//   this: CourseDocument,
// ) {
//   return new Set(
//     this.sessions.flatMap((s: CourseSession) =>
//       s.students.map((sid) => sid.toString()),
//     ),
//   ).size
// })

// courseNEWSchema.virtual('isCurrentlyActive').get(function (
//   this: CourseDocument,
// ) {
//   const now = new Date()
//   return this.sessions.some((session: CourseSession) => {
//     const sessionDate = new Date(session.timeSlot.startTime)
//     return sessionDate > now
//   })
// })

const modelName = 'courseNEW'
export const Course = (models[modelName] ||
  model(modelName, courseNEWSchema)) as Model<CourseDocument>
