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

// Interface pour les absences brutes
interface RawAbsence {
  id: string
  student_stats_id: string
  date: string
  course_session_id: string
  reason?: string
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

      // Récupérer les IDs des étudiants à risque
      const highRiskStudentIds = highRiskStats.map((stat) => stat.user_id)

      // Récupérer les absences détaillées pour ces étudiants
      console.log('🔍 [DEBUG] IDs des étudiants à risque:', highRiskStudentIds)

      // D'abord, récupérer les student_stats_id pour ces étudiants
      const { data: studentStatsData, error: studentStatsError } = await supabase
        .schema('stats')
        .from('student_stats')
        .select('id, user_id')
        .in('user_id', highRiskStudentIds)

      console.log('🔍 [DEBUG] Student stats data:', studentStatsData)

      if (studentStatsError) {
        throw new Error(`Erreur lors de la récupération des student_stats:
        ${studentStatsError.message}`)
      }

      const studentStatsIds = studentStatsData.map((stat) => stat.id)
      console.log('🔍 [DEBUG] Student stats IDs:', studentStatsIds)

      // Maintenant récupérer les absences avec ces student_stats_id
      const { data: absences, error: absencesError } = await supabase
        .schema('stats')
        .from('student_stats_absences')
        .select(`
          id,
          student_stats_id,
          date,
          course_session_id,
          reason
        `)
        .in('student_stats_id', studentStatsIds)
        .order('date', { ascending: false })

      console.log('🔍 [DEBUG] Résultat de la requête absences:', { absences, absencesError })

      if (absencesError) {
        throw new Error(`Erreur lors de la récupération des absences: ${absencesError.message}`)
      }

      // Créer un Map pour un accès rapide aux statistiques
      const statsMap = new Map<string, RawStudentStats>()
      highRiskStats.forEach((stat: RawStudentStats) => {
        statsMap.set(stat.user_id, stat)
      })

      // Créer un Map pour les absences par étudiant
      const absencesMap = new Map<string, RawAbsence[]>()

      // Créer un Map pour mapper student_stats_id vers user_id
      const statsIdToUserIdMap = new Map<string, string>()
      studentStatsData.forEach((stat) => {
        statsIdToUserIdMap.set(stat.id, stat.user_id)
      })

      absences.forEach((absence: RawAbsence) => {
        const userId = statsIdToUserIdMap.get(absence.student_stats_id)
        console.log('🔍 [DEBUG] Traitement absence:', {
          absenceId: absence.id,
          studentStatsId: absence.student_stats_id,
          userId,
          date: absence.date,
        })
        if (userId && !absencesMap.has(userId)) {
          absencesMap.set(userId, [])
        }
        if (userId) {
          absencesMap.get(userId)!.push(absence)
        }
      })

      console.log('🔍 [DEBUG] Map des absences par étudiant:', Object.fromEntries(absencesMap))

      // Combiner les données étudiant et statistiques
      const highRiskStudents: InterfaceHighRiskStudentData[] = students
        .filter((student: any) => statsMap.has(student.id))
        .map((student: any) => {
          const rawStats = statsMap.get(student.id)!
          const studentAbsences = absencesMap.get(student.id) || []

          console.log('🔍 [DEBUG] Traitement étudiant:', {
            studentId: student.id,
            studentName: `${student.firstname} ${student.lastname}`,
            rawStats,
            studentAbsencesCount: studentAbsences.length,
            studentAbsences,
          })

          // Convertir les absences en format Date
          const formattedAbsences = studentAbsences.map(
            (absence: RawAbsence) => ({
              id: absence.id,
              date: new Date(absence.date),
              course: absence.course_session_id,
              reason: absence.reason,
            }),
          )

          console.log('🔍 [DEBUG] Absences formatées pour', student.firstname, ':', formattedAbsences)

          // Convertir les données brutes en format StudentStats
          const stats: StudentStats = {
            userId: rawStats.user_id,
            absencesCount: rawStats.absences_count,
            absencesRate: rawStats.absences_rate,
            behaviorAverage: rawStats.behavior_average,
            absences: formattedAbsences,
            grades: { overallAverage: 0 },
            lastActivity: null,
            lastUpdate: new Date(rawStats.last_update),
          }

          // Calculer la dernière absence
          const lastAbsence = formattedAbsences.length > 0 ? formattedAbsences[0].date : null
          const daysSinceLastAbsence = lastAbsence
            ? Math.floor((new Date().getTime() - lastAbsence.getTime()) / (1000 * 60 * 60 * 24))
            : Infinity

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
