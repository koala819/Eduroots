import {NextRequest, NextResponse} from 'next/server'

import {calculateStudentGrade} from '@/lib/stats/student'

export async function GET(req: NextRequest) {
  const {searchParams} = new URL(req.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({
      status: 400,
      message: 'Missing parameters to processed',
    })
  }

  try {
    const gradeData = await calculateStudentGrade(studentId)

    return NextResponse.json({
      success: true,
      data: gradeData?.grades,
    })
  } catch (error) {
    console.error(`Erreur lors de la récupération des notes pour l'étudiant ${studentId}:`, error)

    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de la récupération des données: ${error instanceof Error ? error.message : String(error)}`,
      },
      {status: 500},
    )
  }
}
