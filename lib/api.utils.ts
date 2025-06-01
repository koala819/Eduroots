import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import {GradeRecord, GradeStats} from '@/types/grade'
import {
  GradeDocument, // StudentDocument,
  // TeacherDocument,
} from '@/types/mongoose'

import dbConnect from '@/backend/config/dbConnect'
import {Grade as GradeModel} from '@/backend/models/zOLDgrade.model'

// import { Student, Teacher } from '@/backend/models/user.model'
// import { Model } from 'mongoose'

// export async function getModel(type: 'student'): Promise<Model<StudentDocument>>
// export async function getModel(type: 'teacher'): Promise<Model<TeacherDocument>>
// export async function getModel(
//   type: 'student' | 'teacher',
// ): Promise<Model<StudentDocument> | Model<TeacherDocument>> {
//   // S'assurer que la connexion est établie
//   await dbConnect()

//   const modelMap = {
//     teacher: Teacher as Model<TeacherDocument>,
//     student: Student as Model<StudentDocument>,
//   } as const

//   const model = modelMap[type]

//   if (!model) {
//     throw new Error(`Invalid user type: ${type}`)
//   }

//   // Vérifier si le modèle est correctement initialisé
//   if (!model.db) {
//     throw new Error(`Model ${type} not properly initialized`)
//   }

//   return model
// }

// Fonction qui calcule uniquement les stats sans mise à jour
export function calculateGradeStats(records: GradeRecord[]) {
  const presentRecords = records.filter((r) => !r.isAbsent)
  const presentValues = presentRecords.map((r) => r.value)

  return {
    averageGrade:
      presentRecords.length > 0
        ? presentRecords.reduce((acc, r) => acc + r.value, 0) / presentRecords.length
        : 0,
    highestGrade: presentValues.length > 0 ? Math.max(...presentValues) : 0,
    lowestGrade: presentValues.length > 0 ? Math.min(...presentValues) : 20,
    absentCount: records.filter((r) => r.isAbsent).length,
    totalStudents: records.length,
  }
}

export async function calculateAndUpdateGradeStats(grade: GradeDocument) {
  const records = grade.records

  // Filtrer les élèves présents une seule fois
  const presentRecords = records.filter((r: GradeRecord) => !r.isAbsent)
  const presentValues = presentRecords.map((r: GradeRecord) => r.value)

  const stats: GradeStats = {
    // Moyenne : total des notes / nombre d'élèves présents (ou 0 si aucun présent)
    averageGrade:
      presentRecords.length > 0
        ? presentRecords.reduce((acc: number, r: GradeRecord) => acc + r.value, 0) /
          presentRecords.length
        : 0,

    // Meilleure note : maximum parmi les élèves présents (ou 0 si aucun présent)
    highestGrade: presentValues.length > 0 ? Math.max(...presentValues) : 0,

    // Note la plus basse : minimum parmi les élèves présents (ou valeur par défaut si aucun présent)
    lowestGrade: presentValues.length > 0 ? Math.min(...presentValues) : 20,
    absentCount: records.filter((r: GradeRecord) => r.isAbsent).length,
    totalStudents: records.length,
  }

  return await GradeModel.findByIdAndUpdate(grade._id, {stats}, {new: true}).lean()
}

// Fonction utilitaire pour l'utilisation typée
// export function isTeacherModel(
//   model: Model<StudentDocument> | Model<TeacherDocument>,
// ): model is Model<TeacherDocument> {
//   return 'subjects' in (model.schema as any).obj
// }

export async function validateRequest(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
  if (!token?.user) {
    return NextResponse.json(
      {message: "Identifiez-vous d'abord pour accéder à cette ressource"},
      {status: 401},
    )
  }
  await dbConnect()
  return null
}

export function generateWeekPeriods(startDate: Date, numWeeks: number) {
  const periods = []
  for (let i = 0; i < numWeeks; i++) {
    const start = new Date(startDate)
    start.setDate(start.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    periods.push({
      start: start,
      end: end,
      label: `${start.toISOString().split('T')[0]} to ${end.toISOString().split('T')[0]}`,
    })
  }
  return periods
}
