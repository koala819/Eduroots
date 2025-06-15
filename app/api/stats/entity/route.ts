import { NextRequest, NextResponse } from 'next/server'

import { StudentStats } from '@/zOLDbackend/models/zOLDstudent-stats.model'
import { TeacherStats } from '@/zOLDbackend/models/zOLDteacher-stats.model'
import { validateRequest } from '@/lib/api.utils'

export async function GET(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    // Récupérer les deux types de statistiques
    const studentStats = await StudentStats.find().sort({ lastUpdate: -1 })
    const teacherStats = await TeacherStats.find().sort({ lastUpdate: -1 })

    // Combiner les résultats
    const allStats = [...studentStats, ...teacherStats]

    return NextResponse.json({ status: 200, data: allStats })
  } catch (error) {
    console.error('[ENTITY_STATS_GET]', error)
    return NextResponse.json({ message: 'Internal Error', status: 500 })
  }
}
