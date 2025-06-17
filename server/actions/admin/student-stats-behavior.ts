'use server'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

import { getStudentBehaviorHistory } from '@/server/actions/api/behaviors'
import { SubjectNameEnum } from '@/types/courses'

export interface BehaviorStats {
  averageRating: number
  totalSessions: number
  bestRating: number
  worstRating: number
  chartData: {
    date: string
    subject: SubjectNameEnum
    level: string
    rating: number
    [key: string]: any
  }[]
  subjects: SubjectNameEnum[]
}

interface BehaviorWithDetails {
  id: string
  behavior_id: string
  student_id: string
  rating: number
  comment: string | null
  created_at: string
  updated_at: string
  course_session_id: string
  date: string
  behavior_rate: string
  total_students: number
  last_update: string
  is_active: boolean
  deleted_at: string | null
  session_id: string
  subject: SubjectNameEnum
  level: string
  course_id: string
  academic_year: number
}

export async function fetchStudentBehaviorStats(studentId: string): Promise<BehaviorStats | null> {
  try {
    const response = await getStudentBehaviorHistory(studentId)

    if (!response.success || !response.data) {
      return null
    }

    // Typer explicitement les données selon la structure que l'API renvoie réellement
    const behaviors = response.data as BehaviorWithDetails[]

    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      return null
    }

    // Calcul des statistiques
    const studentRatings = behaviors
      .map((behavior) => Number(behavior.rating))
      .filter((rating) => !isNaN(rating))

    if (studentRatings.length === 0) {
      return null
    }

    // Préparation des données pour le graphique
    const chartData = behaviors.map((behavior) => ({
      date: format(new Date(behavior.date), 'd MMM yyyy', { locale: fr }),
      rating: Number(behavior.rating),
      subject: behavior.subject,
      level: behavior.level,
      [behavior.subject]: Number(behavior.rating),
    })).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Extraire la liste unique des matières
    const subjects = Array.from(
      new Set(behaviors.map((b) => b.subject)),
    )

    return {
      averageRating:
        studentRatings.reduce((sum, rating) => sum + rating, 0) / studentRatings.length,
      totalSessions: studentRatings.length,
      bestRating: Math.max(...studentRatings),
      worstRating: Math.min(...studentRatings),
      chartData,
      subjects,
    }
  } catch (error) {
    console.error('Error fetching student behavior stats:', error)
    return null
  }
}
