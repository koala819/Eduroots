import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import ClassroomDashboard from '@/client/components/pages/ClassroomDashboard'
import { sortTimeSlots } from '@/client/utils/timeSlots'
import { getStudentsByTeacher } from '@/server/actions/api/teachers'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

const ClassroomPage = async () => {
  try {
    const user = await getAuthenticatedUser()

    // Récupérer l'ID de l'utilisateur dans education.users
    const educationUserId = await getEducationUserId(user.id)

    if (!educationUserId) {
      console.error('[CLASSROOM_PAGE] User not found in education.users')
      return <ErrorContent message="Utilisateur non trouvé" />
    }

    // Récupérer les données des étudiants par professeur
    const studentsResponse = await getStudentsByTeacher(educationUserId)

    if (!studentsResponse.success || !studentsResponse.data) {
      console.error('[CLASSROOM_PAGE] Failed to get students:', studentsResponse.message)
      return <ErrorContent message="Erreur lors de la récupération des données" />
    }

    // Préparer les données côté serveur pour optimiser les performances
    const allTimeSlots = studentsResponse.data.courses.flatMap((course) =>
      course.sessions.map((session) => ({
        id: session.sessionId,
        subject: session.subject,
        dayOfWeek: session.timeSlot,
        level: session.level,
        courseId: course.courseId,
        startTime: session.startTime ? session.startTime.substring(0, 5) : '',
        endTime: session.endTime ? session.endTime.substring(0, 5) : '',
      })),
    )

    // Trier les créneaux côté serveur
    const sortedTimeSlots = [...allTimeSlots].sort(sortTimeSlots)

    // Préparer les données optimisées
    const optimizedData = {
      ...studentsResponse.data,
      // Créneaux triés pour le header
      timeSlots: sortedTimeSlots,
      // Premier créneau par défaut
      defaultSessionId: sortedTimeSlots.length > 0 ? sortedTimeSlots[0].id : null,
      // Cours avec sessions triées
      courses: studentsResponse.data.courses.map((course) => ({
        ...course,
        sessions: [...course.sessions].sort(sortTimeSlots).map((session) => ({
          ...session,
          startTime: session.startTime ? session.startTime.substring(0, 5) : '',
          endTime: session.endTime ? session.endTime.substring(0, 5) : '',
        })),
      })),
    }

    return (
      <Suspense fallback={<LoadingContent />}>
        <ClassroomDashboard
          initialData={optimizedData}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('[CLASSROOM_PAGE]', error)
    return <ErrorContent message="Erreur lors du chargement de la page" />
  }
}

export default ClassroomPage
