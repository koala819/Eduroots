import {NextRequest, NextResponse} from 'next/server'

import {calculateStudentAttendanceRate} from '@/lib/stats/student'

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
    // Utiliser la fonction existante pour calculer le taux d'assiduité
    const attendanceData = await calculateStudentAttendanceRate(studentId)

    return NextResponse.json({
      success: true,
      data: attendanceData,
    })
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données d'assiduité pour l'étudiant ${studentId}:`,
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de la récupération des données: ${error instanceof Error ? error.message : String(error)}`,
      },
      {status: 500},
    )
  }
}
