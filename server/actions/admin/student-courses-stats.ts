import { getAllCoursesWithStats } from '@/server/actions/api/courses'
import { CourseWithRelations } from '@/types/courses'

export async function getCoursesWithStudentStats() {
  // Récupérer tous les cours avec leurs relations et statistiques
  const coursesResponse = await getAllCoursesWithStats()

  if (!coursesResponse.success || !coursesResponse.data) {
    console.error('Erreur dans getCoursesWithStudentStats:', coursesResponse)
    throw new Error('Erreur lors de la récupération des cours')
  }

  const coursesData = coursesResponse.data

  // Enrichir les cours avec les statistiques calculées côté serveur
  const enrichedCourses = coursesData.map((course) => {
    // Calculer les stats pour ce cours
    const courseStats = calculateCourseStats(course)

    // Enrichir chaque session avec ses créneaux horaires individuels
    const enrichedSessions = course.courses_sessions.map((session) => {
      // Préserver chaque créneau horaire individuellement au lieu de les regrouper
      const individualTimeSlots = session.courses_sessions_timeslot.map((timeslot) => ({
        day_of_week: timeslot.day_of_week,
        start_time: timeslot.start_time,
        end_time: timeslot.end_time,
        classroom_number: timeslot.classroom_number,
        // Ajouter les informations de la session pour ce créneau
        subject: session.subject,
        level: session.level,
        session_id: session.id,
      }))

      return {
        ...session,
        // Garder les créneaux individuels au lieu d'une plage regroupée
        individualTimeSlots,
        // Calculer la plage complète pour ce créneau spécifique
        timeRange: individualTimeSlots.length > 0 ? {
          min_start_time: individualTimeSlots[0].start_time,
          max_end_time: individualTimeSlots[0].end_time,
          day_of_week: individualTimeSlots[0].day_of_week,
        } : null,
      }
    })

    return {
      ...course,
      courses_sessions: enrichedSessions,
      stats: courseStats, // Ajouter les stats pré-calculées
    }
  })

  return enrichedCourses
}


function calculateCourseStats(course: CourseWithRelations) {
  // Set pour dédupliquer rapidement les étudiants
  const uniqueStudentIds = new Set<string>()
  let totalAge = 0
  let validAgeCount = 0
  let countBoys = 0
  let countGirls = 0

  // Parcourir toutes les sessions du cours
  course.courses_sessions.forEach((session) => {
    session.courses_sessions_students?.forEach((enrollment) => {
      if (enrollment.users && !uniqueStudentIds.has(enrollment.student_id)) {
        uniqueStudentIds.add(enrollment.student_id)

        // Compter par genre
        const gender = enrollment.users.gender?.toLowerCase()
        if (gender === 'masculin' || gender === 'male' || gender === 'm') {
          countBoys++
        } else if (gender === 'féminin' || gender === 'female' || gender === 'f') {
          countGirls++
        }

        // Calculer l'âge si disponible
        if (enrollment.users.date_of_birth) {
          const birthDate = new Date(enrollment.users.date_of_birth)
          const age = new Date().getFullYear() - birthDate.getFullYear()
          totalAge += age
          validAgeCount++
        }
      }
    })
  })

  const totalStudents = uniqueStudentIds.size
  const averageAge = validAgeCount > 0 ? Math.round(totalAge / validAgeCount) : 0

  // Calculer les pourcentages
  const percentageBoys = totalStudents > 0 ? Math.round((countBoys / totalStudents) * 100) : 0
  const percentageGirls = totalStudents > 0 ? Math.round((countGirls / totalStudents) * 100) : 0

  return {
    totalStudents,
    averageAge,
    countBoys,
    countGirls,
    percentageBoys,
    percentageGirls,
  }
}
