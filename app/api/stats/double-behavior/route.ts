import {NextResponse} from 'next/server'
import {generateDateRanges, getSessionServer} from '@/utils/server-helpers'
import {Database} from '@/types/supabase/db'

// Type de base pour un comportement
type BaseBehavior = Database['education']['Tables']['behaviors']['Row'] & {
  behavior_records: Database['education']['Tables']['behavior_records']['Row'][]
}

// Type étendu avec les champs supplémentaires
type BehaviorWithPeriod = BaseBehavior & {
  weekPeriod: string
  formattedDate: string
}

export async function GET() {
  try {
    const {supabase} = await getSessionServer()

    const startDateString = process.env.START_YEAR
    if (!startDateString) {
      throw new Error('START_YEAR environment variable is not defined')
    }

    const startDate = new Date(startDateString)
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid START_YEAR format in environment variable')
    }

    const endDate = new Date()
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )

    const weekPeriods = generateDateRanges(startDate, numWeeks)

    // Récupérer les comportements avec leurs enregistrements
    const {data: behaviors, error: behaviorsError} = await supabase
      .schema('education')
      .from('behaviors')
      .select(`
        *,
        behavior_records (*)
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('date', {ascending: true})

    if (behaviorsError) throw behaviorsError

    // Ajouter le weekPeriod à chaque comportement
    const behaviorsWithWeekPeriod = behaviors.map(behavior => {
      const date = new Date(behavior.date)
      const weekPeriod = weekPeriods.find(
        period => date >= period.start && date < new Date(period.end.getTime() + 86400000)
      )?.label ?? 'Other'

      return {
        ...behavior,
        weekPeriod,
        formattedDate: date.toISOString().split('T')[0]
      } as BehaviorWithPeriod
    })

    // Grouper les comportements
    const groupedBehaviors = behaviorsWithWeekPeriod.reduce<Record<string, BehaviorWithPeriod[]>>((acc, behavior) => {
      const key = `${behavior.course_id}_${behavior.weekPeriod}`  // Suppression de formattedDate
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(behavior)
      return acc
    }, {})

    // Filtrer et formater les résultats
    const duplicates = Object.entries(groupedBehaviors)
      .filter(([_, group]) => group.length > 1)
      .map(([_, group]) => ({
        course: group[0].course_id,
        weekPeriod: group[0].weekPeriod,
        count: group.length,
        behaviors: group
      }))
      .sort((a, b) => new Date(a.behaviors[0].date).getTime() - new Date(b.behaviors[0].date).getTime())


    return NextResponse.json({
      status: 200,
      data: duplicates,
    })
  } catch (error: any) {
    if (error.message === 'Non authentifié') {
      return NextResponse.json({
        statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
        status: 401,
      })
    }

    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
