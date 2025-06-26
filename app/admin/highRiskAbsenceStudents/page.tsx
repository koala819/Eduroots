import { Suspense } from 'react'

import {
  HighRiskAbsenceStudents,
} from '@/client/components/admin/molecules/HighRiskAbsenceStudents'
import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { refreshEntityStats } from '@/server/actions/api/stats'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { StudentStats } from '@/types/stats'
import { StudentResponse } from '@/types/student-payload'

export interface InterfaceHighRiskStudentData {
  student: StudentResponse
  stats: StudentStats
  riskLevel: 'high' | 'critical'
  lastAbsenceDate: Date | null
  daysSinceLastAbsence: number
}

// Interface pour les données brutes de la base
interface RawStudentStats {
  user_id: string
  absences_count: number
  absences_rate: number
  behavior_average: number
  last_update: string
}

export default async function HighRiskAbsenceStudentsPage() {

  const initialData = await getHighRiskStudents()

  if (initialData.error) {
    return <ErrorContent message={initialData.error} />
  }

  async function getHighRiskStudents(): Promise<{
  students: InterfaceHighRiskStudentData[]
  totalCount: number
  error?: string
}> {
    try {
      await getAuthenticatedUser()
      const { supabase } = await getSessionServer()

      // Récupérer les statistiques des étudiants
      const statsResponse = await refreshEntityStats()
      if (!statsResponse.success || !statsResponse.data) {
        throw new Error(statsResponse.message || 'Erreur lors du chargement des statistiques')
      }

      // Filtrer les statistiques étudiants (qui ont user_id et absences_count)
      const studentStats = statsResponse.data.filter((stat: any) => {
        return stat !== null &&
        typeof stat === 'object' &&
        'user_id' in stat &&
        'absences_count' in stat
      }) as RawStudentStats[]

      // Récupérer tous les étudiants
      const { data: students, error: studentsError } = await supabase
        .schema('education')
        .from('users')
        .select('*')
        .eq('role', 'student')
        .eq('is_active', true)
        .order('lastname', { ascending: true })

      if (studentsError) {
        throw new Error(`Erreur lors de la récupération des étudiants: ${studentsError.message}`)
      }

      // Filtrer les étudiants à risque (absences multiples de 3)
      const highRiskStats = studentStats.filter((stat: RawStudentStats) => {
        const isMultipleOf3 = stat.absences_count % 3 === 0
        const hasAbsences = stat.absences_count > 0
        return isMultipleOf3 && hasAbsences
      })

      // Créer un Map pour un accès rapide aux statistiques
      const statsMap = new Map<string, RawStudentStats>()
      highRiskStats.forEach((stat: RawStudentStats) => {
        statsMap.set(stat.user_id, stat)
      })

      // Combiner les données étudiant et statistiques
      const highRiskStudents: InterfaceHighRiskStudentData[] = students
        .filter((student: any) => statsMap.has(student.id))
        .map((student: any) => {
          const rawStats = statsMap.get(student.id)!

          // Convertir les données brutes en format StudentStats
          const stats: StudentStats = {
            userId: rawStats.user_id,
            absencesCount: rawStats.absences_count,
            absencesRate: rawStats.absences_rate,
            behaviorAverage: rawStats.behavior_average,
            absences: [], // On n'a pas les détails des absences ici
            grades: { overallAverage: 0 },
            lastActivity: null,
            lastUpdate: new Date(rawStats.last_update),
          }

          const lastAbsence = null // Pas de données détaillées pour l'instant
          const daysSinceLastAbsence = Infinity

          const riskLevel: 'high' | 'critical' = stats.absencesCount >= 9 ? 'critical' : 'high'

          return {
            student,
            stats,
            riskLevel,
            lastAbsenceDate: lastAbsence,
            daysSinceLastAbsence,
          }
        })
        .sort((a, b) => {
        // Tri par niveau de risque puis par nombre d'absences
          if (a.riskLevel !== b.riskLevel) {
            return a.riskLevel === 'critical' ? -1 : 1
          }
          return b.stats.absencesCount - a.stats.absencesCount
        })

      return {
        students: highRiskStudents,
        totalCount: highRiskStudents.length,
      }
    } catch (error) {
      console.error('[HIGH_RISK_STUDENTS_SERVER]', error)
      return {
        students: [],
        totalCount: 0,
        error: error instanceof Error ? error.message : 'Erreur inconnue',
      }
    }
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense fallback={<LoadingContent />}>
        <HighRiskAbsenceStudents initialData={initialData} />
      </Suspense>
    </div>
  )

}
