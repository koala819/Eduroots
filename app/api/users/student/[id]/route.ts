import {NextRequest, NextResponse} from 'next/server'

import {GradeRecord} from '@/types/grade'

import {Grade as GradeModel} from '@/backend/models/grade.model'
import {User as UserModel} from '@/backend/models/user.model'
import {validateRequest} from '@/lib/api.utils'

// Type pour les stats
interface StudentStats {
  averageProgress: number
  lastThreeGrades: number[]
  attendanceRate: number
}

type Params = Promise<{ id: string }>

// Helper function pour le calcul des stats
function calculateStudentStats(studentRecords: any[]): StudentStats {
  const presentRecords = studentRecords.filter((record) => !record.isAbsent)

  return {
    averageProgress: presentRecords.length
      ? +(
          presentRecords.reduce((acc, record) => acc + record.value, 0) / presentRecords.length
        ).toFixed(2)
      : 0,
    lastThreeGrades: presentRecords.slice(0, 3).map((record) => record.value),
    attendanceRate: studentRecords.length
      ? +((presentRecords.length / studentRecords.length) * 100).toFixed(2)
      : 0,
  }
}

export async function GET(req: NextRequest, {params}: {params: Params}) {
  const { id: studentId } = await params;

  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const url = new URL(req.url)
    const fields = url.searchParams.get('fields')

    // Vérifier que l'étudiant existe
    const student = await UserModel.findById(studentId).lean()
    if (!student) {
      return NextResponse.json({
        status: 404,
        message: 'Étudiant non trouvé',
      })
    }

    // Traitement des stats
    if (fields === 'stats') {
      const grades = await GradeModel.find({
        'records.student': studentId,
      })
        .sort({date: -1})
        .lean()

      const studentRecords = grades
        .map((grade) => {
          const record = grade.records.find((r: GradeRecord) => r.student.toString() === studentId)
          return record ? {...record, date: grade.date} : null
        })
        .filter(Boolean) // Remove null values

      const stats = calculateStudentStats(studentRecords)

      return NextResponse.json({
        status: 200,
        message: 'Statistiques récupérées avec succès',
        data: stats,
      })
    }

    // Retour des données complètes de l'étudiant
    return NextResponse.json({
      status: 200,
      message: 'Étudiant récupéré avec succès',
      data: student,
    })
  } catch (error: any) {
    console.error('Error fetching student stats:', error)
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
