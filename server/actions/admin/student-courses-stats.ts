import { getAllCoursesWithStats, getCoursesTimeRange } from '@/server/actions/api/courses'

export async function getCoursesWithStudentStats() {
  // Récupérer tous les cours avec leurs relations et statistiques
  const [coursesResponse, timeRangesResponse] = await Promise.all([
    getAllCoursesWithStats(),
    getCoursesTimeRange(),
  ])

  if (!coursesResponse.success || !coursesResponse.data) {
    console.error('Erreur dans getCoursesWithStudentStats:', coursesResponse)
    throw new Error('Erreur lors de la récupération des cours')
  }

  if (!timeRangesResponse.success || !timeRangesResponse.data) {
    console.error('Erreur dans getCoursesWithStudentStats - timeRanges:', timeRangesResponse)
    throw new Error('Erreur lors de la récupération des plages horaires')
  }

  const coursesData = coursesResponse.data
  const timeRangesData = timeRangesResponse.data

  // Enrichir les cours avec leurs plages horaires complètes
  const enrichedCourses = coursesData.map((course) => {
    // Trouver les plages horaires pour ce cours
    const courseTimeRanges = timeRangesData.filter(
      (range) => range.course_id === course.id,
    )

    // Enrichir chaque session avec sa plage horaire complète
    const enrichedSessions = course.courses_sessions.map((session) => {
      // Trouver la plage horaire pour cette session (même jour)
      const sessionDay = session.courses_sessions_timeslot[0]?.day_of_week
      const timeRange = courseTimeRanges.find((range) => range.day_of_week === sessionDay)

      return {
        ...session,
        completeTimeRange: timeRange ? {
          min_start_time: timeRange.min_start_time,
          max_end_time: timeRange.max_end_time,
          day_of_week: timeRange.day_of_week,
          subjects: timeRange.subjects || [],
        } : null,
      }
    })

    return {
      ...course,
      courses_sessions: enrichedSessions,
      timeRanges: courseTimeRanges,
    }
  })

  return enrichedCourses
}
