'use server'

import { getStudentAttendance } from '@/server/actions/api/stats'
import { refreshEntityStats } from '@/server/actions/api/stats'
import { getAllStudents } from '@/server/actions/api/students'
import { StatsStudent } from '@/types/db'
import { HighRiskStudentData,StudentStats } from '@/types/stats'

export type SortType = 'risk-level' | 'recent-absence' | 'alphabetical'

export interface HighRiskStudentsResponse {
  students: HighRiskStudentData[]
  totalCount: number
  stats: {
    lowCount: number
    mediumCount: number
    highCount: number
    totalAbsences: number
  }
  error?: string
}

export async function getHighRiskStudents(): Promise<HighRiskStudentsResponse> {
  try {
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
    }) as StatsStudent[]

    // Récupérer tous les étudiants avec la fonction existante
    const studentsResponse = await getAllStudents()
    if (!studentsResponse.success || !studentsResponse.data) {
      throw new Error(studentsResponse.message || 'Erreur lors de la récupération des étudiants')
    }

    const students = studentsResponse.data

    // Filtrer les étudiants à risque (seulement ceux avec des absences multiples de 3)
    const highRiskStats = studentStats.filter((stat: StatsStudent) => {
      const isMultipleOf3 = stat.absences_count % 3 === 0
      const hasAbsences = stat.absences_count > 0
      return isMultipleOf3 && hasAbsences
    })

    // Créer un Map pour un accès rapide aux statistiques
    const statsMap = new Map<string, StatsStudent>()
    highRiskStats.forEach((stat: StatsStudent) => {
      statsMap.set(stat.user_id, stat)
    })

    // Récupérer les absences détaillées pour chaque étudiant à risque
    const highRiskStudents: HighRiskStudentData[] = []

    for (const student of students) {
      if (statsMap.has(student.id)) {
        const rawStats = statsMap.get(student.id)!

        // Récupérer les absences détaillées avec la fonction existante
        const attendanceResponse = await getStudentAttendance(student.id)
        let absences: any[] = []

        if (attendanceResponse.success && attendanceResponse.data) {
          absences = attendanceResponse.data.absences || []
        }

        const stats: StudentStats = {
          userId: rawStats.user_id,
          absencesCount: rawStats.absences_count,
          absencesRate: rawStats.absences_rate,
          behaviorAverage: rawStats.behavior_average,
          absences: absences,
          grades: { overallAverage: 0 },
          lastActivity: rawStats.last_activity,
          lastUpdate: new Date(rawStats.last_update),
        }

        // Calculer la dernière absence
        const lastAbsence = absences.length > 0 ? absences[0].date : null
        const daysSinceLastAbsence = lastAbsence
          ? Math.floor((new Date().getTime() - lastAbsence.getTime()) / (1000 * 60 * 60 * 24))
          : Infinity

        // Déterminer le niveau de risque basé sur le nombre d'absences
        let riskLevel: 'low' | 'medium' | 'high'

        if (stats.absencesCount >= 9) {
          riskLevel = 'high'
        } else if (stats.absencesCount >= 6) {
          riskLevel = 'medium'
        } else {
          riskLevel = 'low'
        }

        highRiskStudents.push({
          student,
          stats,
          riskLevel,
          lastAbsenceDate: lastAbsence,
          daysSinceLastAbsence,
        })
      }
    }

    // Tri par défaut (niveau de risque puis nombre d'absences)
    highRiskStudents.sort((a, b) => {
      const riskOrder = { high: 3, medium: 2, low: 1 }
      const aRisk = riskOrder[a.riskLevel as keyof typeof riskOrder]
      const bRisk = riskOrder[b.riskLevel as keyof typeof riskOrder]

      if (aRisk !== bRisk) {
        return bRisk - aRisk // Élevé en premier
      }
      return b.stats.absencesCount - a.stats.absencesCount
    })

    // Calculer les statistiques
    const lowCount = highRiskStudents.filter((s) => s.riskLevel === 'low').length
    const mediumCount = highRiskStudents.filter((s) => s.riskLevel === 'medium').length
    const highCount = highRiskStudents.filter((s) => s.riskLevel === 'high').length
    const totalAbsences = highRiskStudents.reduce((sum, s) => sum + s.stats.absencesCount, 0)

    return {
      students: highRiskStudents,
      totalCount: highRiskStudents.length,
      stats: {
        lowCount,
        mediumCount,
        highCount,
        totalAbsences,
      },
    }
  } catch (error) {
    console.error('[HIGH_RISK_STUDENTS_SERVER]', error)
    return {
      students: [],
      totalCount: 0,
      stats: {
        lowCount: 0,
        mediumCount: 0,
        highCount: 0,
        totalAbsences: 0,
      },
      error: error instanceof Error ? error.message : 'Erreur inconnue',
    }
  }
}
