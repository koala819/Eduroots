import { getAllCoursesWithStats } from '@/server/actions/api/courses'

export async function getCoursesWithStudentStats() {
  // Récupérer tous les cours avec leurs relations et statistiques
  const coursesResponse = await getAllCoursesWithStats()

  if (!coursesResponse.success || !coursesResponse.data) {
    console.error('Erreur dans getCoursesWithStudentStats:', coursesResponse)
    throw new Error('Erreur lors de la récupération des cours')
  }

  const coursesData = coursesResponse.data

  // Enrichir les cours en préservant chaque créneau horaire individuellement
  const enrichedCourses = coursesData.map((course) => {
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
    }
  })

  return enrichedCourses
}
