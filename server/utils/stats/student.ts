import { getSessionServer } from '@/server/utils/server-helpers'
import { SubjectNameEnum } from '@/types/courses'

export async function calculateStudentAttendanceRate(studentId: string) {
  try {
    const { supabase } = await getSessionServer()

    // Récupérer tous les enregistrements de présence pour cet étudiant
    const { data: attendanceRecords, error } = await supabase
      .schema('education')
      .from('attendance_records')
      .select(`
        *,
        attendances (
          id,
          date,
          course_id,
          courses (
            id,
            academic_year
          )
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      console.error('Erreur lors de la récupération des présences:', error)
      throw error
    }

    // Trier les enregistrements par date décroissante côté client
    const sortedRecords = attendanceRecords?.sort((a, b) =>
      new Date(b.attendances.date).getTime() - new Date(a.attendances.date).getTime(),
    ) || []

    console.log('📊 Enregistrements de présence trouvés:', sortedRecords.length)

    // Calculer les statistiques de présence
    let totalSessions = 0
    let absencesCount = 0
    const absences: {date: Date; course: string}[] = []

    sortedRecords.forEach((record) => {
      totalSessions++
      if (!record.is_present) {
        absencesCount++
        absences.push({
          date: new Date(record.attendances.date),
          course: record.attendances.course_id,
        })
      }
    })

    // Calculer le taux d'absence
    const absencesRate = totalSessions > 0 ? (absencesCount / totalSessions) * 100 : 0

    // Récupérer la dernière date d'activité
    const lastActivity = sortedRecords && sortedRecords.length > 0
      ? new Date(sortedRecords[0].attendances.date)
      : null

    // Récupérer les statistiques existantes
    const { data: existingStats } = await supabase
      .schema('stats')
      .from('student_stats')
      .select('*')
      .eq('user_id', studentId)
      .single()

    // Vérifier si les statistiques sont déjà à jour
    const existingLastActivity = existingStats?.last_activity
      ? new Date(existingStats.last_activity).getTime()
      : null

    if (
      existingStats &&
      existingStats.absences_count === absencesCount &&
      existingStats.absences_rate === absencesRate &&
      existingLastActivity === lastActivity?.getTime()
    ) {
      console.log('📊 Statistiques déjà à jour pour l\'étudiant:', studentId)
      return {
        studentId,
        totalSessions,
        absencesCount,
        lastActivity,
        absencesRate,
        absences,
      }
    }

    // Mettre à jour les statistiques de l'étudiant
    const statsData = {
      user_id: studentId,
      absences_rate: absencesRate,
      absences_count: absencesCount,
      last_activity: lastActivity?.toISOString(),
      last_update: new Date().toISOString(),
      behavior_average: existingStats?.behavior_average || 0,
    }

    if (existingStats) {
      await supabase
        .schema('stats')
        .from('student_stats')
        .update(statsData)
        .eq('user_id', studentId)
    } else {
      await supabase
        .schema('stats')
        .from('student_stats')
        .insert([statsData])
    }

    // Gérer les absences individuelles
    if (absences.length > 0) {
      // Supprimer les anciennes absences
      await supabase
        .schema('stats')
        .from('student_stats_absences')
        .delete()
        .eq('student_stats_id', existingStats?.id || studentId)

      // Insérer les nouvelles absences
      const absenceRecords = absences.map((absence) => ({
        student_stats_id: existingStats?.id || studentId,
        date: absence.date.toISOString(),
        course_session_id: absence.course,
        reason: 'absent',
      }))

      await supabase
        .schema('stats')
        .from('student_stats_absences')
        .insert(absenceRecords)
    }

    console.log('📊 Statistiques mises à jour:', {
      studentId,
      totalSessions,
      absencesRate,
      absencesCount,
      absences: absences.map((a) => ({
        date: a.date.toISOString(),
        course: a.course,
      })),
      lastActivity: lastActivity?.toISOString(),
    })

    return {
      studentId,
      totalSessions,
      absencesCount,
      lastActivity,
      absencesRate,
      absences,
    }
  } catch (error) {
    console.error('Erreur lors du calcul du taux de présence :', error)
    throw error
  }
}

export async function calculateStudentBehaviorRate(studentId: string) {
  try {
    const { supabase } = await getSessionServer()

    // Récupérer tous les enregistrements de comportement pour cet étudiant
    const { data: behaviorRecords, error } = await supabase
      .schema('education')
      .from('behavior_records')
      .select(`
        *,
        behaviors (
          id,
          date,
          course_session_id
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      console.error('Erreur lors de la récupération des comportements:', error)
      throw error
    }

    // Objet pour tracker les dates uniques et leurs enregistrements
    const uniqueBehaviors: {[key: string]: any} = {}

    // Calculer les statistiques de comportement
    let totalSessions = 0
    let totalRatingSum = 0

    behaviorRecords?.forEach((record) => {
      // Convertir la date en chaîne pour comparaison
      const dateString = new Date(record.behaviors.date).toISOString().split('T')[0]

      // Vérifier si cette date a déjà été vue
      if (!uniqueBehaviors[dateString]) {
        uniqueBehaviors[dateString] = record.behaviors
        totalSessions++

        // Si l'étudiant a reçu une note sur son comportement
        if (record.rating) {
          totalRatingSum += record.rating
        }
      }
    })

    // Convertir l'objet en tableau pour les records
    const uniqueBehaviorRecords = Object.values(uniqueBehaviors)

    // Récupérer la dernière date de session
    const lastActivity = uniqueBehaviorRecords.length > 0
      ? uniqueBehaviorRecords.reduce((latest, current) =>
        new Date(current.date) > new Date(latest.date) ? current : latest,
      ).date
      : null

    // Calculer la moyenne de comportement
    const behaviorAverage = totalSessions > 0
      ? Number((totalRatingSum / totalSessions).toFixed(2))
      : 0

    return {
      studentId,
      behaviorAverage,
      lastActivity,
      records: uniqueBehaviorRecords,
    }
  } catch (error) {
    console.error('Erreur lors du calcul du taux de comportement :', error)
    throw error
  }
}

export async function calculateStudentGrade(studentId: string) {
  const { supabase } = await getSessionServer()

  // 1. Récupérer tous les enregistrements de notes
  const { data: gradeRecords, error } = await supabase
    .schema('education')
    .from('grades_records')
    .select(`
      *,
      grades (
        id,
        course_session_id,
        date,
        is_draft,
        courses_sessions (
          id,
          subject,
          course_id
        )
      )
    `)
    .eq('student_id', studentId)
    .eq('is_absent', false)

  if (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    throw error
  }

  // 2. Vérifier si l'étudiant a des notes
  const hasGrades = gradeRecords && gradeRecords.length > 0

  // Structure pour stocker les notes par matière
  const subjectGrades: {
    [key in SubjectNameEnum]?: {
      grades: number[]
      average?: number
    }
  } = {}

  // Initialiser les matières
  Object.values(SubjectNameEnum).forEach((subject) => {
    subjectGrades[subject] = { grades: [] }
  })

  const studentGrades: {
    subject: string
    student: string
    grade: number
    sessionId?: string
  }[] = []

  let courseId: string | undefined = undefined
  let overallAverage: number | undefined = undefined

  // 3. Collecter les notes de l'étudiant
  if (hasGrades) {
    gradeRecords.forEach((record) => {
      if (!courseId) {
        courseId = record.grades.courses_sessions.course_id
      }

      if (record.value && !record.is_absent && !record.grades.is_draft) {
        const subject = record.grades.courses_sessions.subject || 'Unknown'

        studentGrades.push({
          sessionId: record.grades.course_session_id,
          student: studentId,
          grade: record.value,
          subject: subject,
        })

        // Populate subject grades
        if (subjectGrades[subject as SubjectNameEnum]) {
          subjectGrades[subject as SubjectNameEnum]?.grades.push(record.value)
        }
      }
    })

    // Calculate average for each subject
    Object.keys(subjectGrades).forEach((subject) => {
      const subjectData = subjectGrades[subject as SubjectNameEnum]
      if (subjectData && subjectData.grades.length > 0) {
        subjectData.average =
          subjectData.grades.reduce((a, b) => a + b, 0) / subjectData.grades.length
      } else {
        // Remove subjects with no grades
        delete subjectGrades[subject as SubjectNameEnum]
      }
    })

    // Calculate general average
    if (studentGrades.length > 0) {
      overallAverage = studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length
    }

    // 4. Préparer le retour
    return {
      studentId,
      hasGrades,
      courseId,
      totalGradeRecords: gradeRecords.length,
      grades: {
        details: studentGrades,
        bySubject: subjectGrades,
        overallAverage: overallAverage,
      },
    }
  }

  return null
}
