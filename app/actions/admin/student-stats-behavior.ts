'use server'

import {BehaviorRecord} from '@/types/behavior'
import {SubjectNameEnum} from '@/types/course'
import {BehaviorDocument} from '@/types/mongoose'

import {getStudentBehaviorHistory} from '@/app/actions/context/behaviors'
import {format} from 'date-fns'
import {fr} from 'date-fns/locale'

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

export async function fetchStudentBehaviorStats(studentId: string): Promise<BehaviorStats | null> {
  try {
    const response = await getStudentBehaviorHistory(studentId)

    if (!response.success || !response.data) {
      return null
    }

    // Typer explicitement les données selon la structure que l'API renvoie réellement
    const behaviors = response.data as unknown as any[]

    if (!Array.isArray(behaviors) || behaviors.length === 0) {
      return null
    }

    // Calcul des statistiques avec vérification de type
    const studentRatings = behaviors.flatMap((behavior) => {
      if (!Array.isArray(behavior.records)) return []

      return behavior.records
        .filter((record: BehaviorDocument) => {
          const studentObj = record.student
          const recordStudentId = studentObj?.id || studentObj?._id
          return recordStudentId === studentId
        })
        .map((record: BehaviorRecord) => Number(record.rating))
        .filter((rating: number) => !isNaN(rating))
    })

    if (studentRatings.length === 0) {
      return null
    }

    // Préparation des données pour le graphique
    const chartData = behaviors
      .map((behavior) => {
        if (!Array.isArray(behavior.records)) return null

        const studentRecord = behavior.records.find((record: BehaviorDocument) => {
          const studentObj = record.student
          return (studentObj?.id || studentObj?._id) === studentId
        })

        if (!studentRecord) return null

        const session = behavior.courseDetails?.session
        if (!session) return null

        const subject = session.subject || 'Unknown'
        const level = session.level || 'Unknown'

        // Formater la date
        const formattedDate = format(new Date(behavior.date), 'd MMM yyyy', {
          locale: fr,
        })

        return {
          date: formattedDate,
          rating: Number(studentRecord.rating),
          subject: subject as SubjectNameEnum,
          level: level,
          [subject]: Number(studentRecord.rating),
        }
      })
      .filter((data): data is NonNullable<typeof data> => data !== null)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Extraire la liste unique des matières
    const subjects = Array.from(
      new Set(
        behaviors.map((b) => b.courseDetails?.session?.subject || ('Unknown' as SubjectNameEnum)),
      ),
    ).filter((subject) => subject !== 'Unknown')

    return {
      averageRating:
        studentRatings.reduce((sum, rating) => sum + rating, 0) / studentRatings.length,
      totalSessions: studentRatings.length,
      bestRating: Math.max(...studentRatings),
      worstRating: Math.min(...studentRatings),
      chartData,
      subjects: subjects as SubjectNameEnum[],
    }
  } catch (error) {
    console.error('Error fetching student behavior stats:', error)
    return null
  }
}
