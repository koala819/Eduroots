import { NextRequest, NextResponse } from 'next/server'

import { calculateStudentBehaviorRate } from '@/lib/stats/student'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const studentId = searchParams.get('studentId')

  if (!studentId) {
    return NextResponse.json({
      status: 400,
      message: 'Missing parameters to processed',
    })
  }

  try {
    // Utiliser la fonction existante pour calculer le taux d'assiduité
    const behaviorData = await calculateStudentBehaviorRate(studentId)

    return NextResponse.json({
      success: true,
      data: behaviorData,
    })
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données de comportement pour l'étudiant ${studentId}:`,
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error: `Erreur lors de la récupération des données: ${error instanceof Error ? error.message : String(error)}`,
      },
      { status: 500 },
    )
  }
}
