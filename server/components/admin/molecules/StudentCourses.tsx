import { StudentCoursesClient } from '@/client/components/admin/molecules/StudentCoursesClient'
import { getStudentCourses } from '@/server/actions/api/courses'
import { TimeSlotEnum } from '@/types/courses'

export async function StudentCourses({
  studentId,
}: Readonly<{ studentId: string }>) {
  try {
    const response = await getStudentCourses(studentId)

    if (!response.success || !response.data) {
      return {
        success: false,
        message: response.message || 'Aucun cours trouvé pour cet étudiant.',
        data: null,
      }
    }

    const courses = response.data as any[]

    // Transformer les enrollments en structure attendue
    const transformedCourses = courses.map((enrollment) => {
      const session = enrollment.courses_sessions
      const course = session.courses
      const teacher = course.courses_teacher?.[0]?.users

      return {
        id: course.id,
        teacher: teacher || {},
        sessions: [{
          id: session.id,
          subject: session.subject,
          level: session.level,
          timeSlot: {
            day_of_week: session.courses_sessions_timeslot?.[0]?.day_of_week,
            startTime: session.courses_sessions_timeslot?.[0]?.start_time,
            endTime: session.courses_sessions_timeslot?.[0]?.end_time,
          },
          students: [{
            _id: enrollment.student_id,
            // Ajouter d'autres propriétés si nécessaire
          }],
        }],
      }
    })

    // Traitement similaire à celui de votre code original
    const filteredCourses = transformedCourses
      .map((course) => {
        // Vérifier que course.sessions existe avant de filtrer
        if (!course.sessions || !Array.isArray(course.sessions)) {
          return {
            ...course,
            sessions: [],
          }
        }

        const filteredSessions = course.sessions.filter((session: any) => {
          // Vérifier que session.students existe et est un tableau
          if (!session.students || !Array.isArray(session.students)) {
            return false
          }
          return session.students.some((student: any) => student._id === studentId)
        })
        return {
          ...course,
          sessions: filteredSessions,
        }
      })
      .filter((course) => course.sessions.length > 0)

    const allSessions = filteredCourses.flatMap((course) =>
      course.sessions.map((session: any) => ({
        session,
        teacher: course.teacher,
      })),
    )

    const sortedStudentSessions = allSessions.toSorted((a: any, b: any) => {
      const timeSlotOrder = {
        [TimeSlotEnum.SATURDAY_MORNING]: 0,
        [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
        [TimeSlotEnum.SUNDAY_MORNING]: 2,
      }

      const dayDiff =
        timeSlotOrder[a.session.timeSlot.day_of_week as TimeSlotEnum] -
        timeSlotOrder[b.session.timeSlot.day_of_week as TimeSlotEnum]

      if (dayDiff !== 0) return dayDiff

      const getMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      return getMinutes(a.session.timeSlot.startTime) - getMinutes(b.session.timeSlot.startTime)
    })

    return {
      success: true,
      data: sortedStudentSessions,
      message: 'Cours récupérés avec succès',
    }
  } catch (error) {
    console.error('Error in CourseDataLoader:', error)
    return {
      success: false,
      message: 'Erreur lors de la récupération des cours',
      data: null,
    }
  }
}

// Composant serveur qui utilise le client
export async function StudentCoursesWrapper({
  studentId,
}: Readonly<{ studentId: string }>) {
  const result = await StudentCourses({ studentId })
  return <StudentCoursesClient result={result} />
}
