// Le nouvel endpoint - sauvegardez ceci dans /pages/api/student-stats.ts ou votre structure équivalente
import {NextRequest, NextResponse} from 'next/server'

import {StudentStats} from '@/zOLDbackend/models/zOLDstudent-stats.model'
import {validateRequest} from '@/lib/api.utils'

export async function GET(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  // Récupérer les paramètres de filtre de la requête
  const url = new URL(req.url)
  const multipleOfThree = url.searchParams.get('multipleOfThree') === 'true'

  try {
    // Base query pour les statistiques des étudiants
    let query = StudentStats.find().sort({lastUpdate: -1})

    // Si le filtre multipleOfThree est actif, on ne garde que les absences multiples de 3
    if (multipleOfThree) {
      query = StudentStats.find({
        absencesCount: {$gt: 0, $mod: [3, 0]},
      }).sort({lastUpdate: -1})
    }

    const studentStats = await query.exec()

    return NextResponse.json({status: 200, data: studentStats})
  } catch (error) {
    console.error('[STUDENT_STATS_GET]', error)
    return NextResponse.json({message: 'Internal Error', status: 500})
  }
}
