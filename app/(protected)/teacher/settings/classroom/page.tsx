import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import ClassroomDashboard from '@/client/components/pages/ClassroomDashboard'
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

    return (
      <Suspense fallback={<LoadingContent />}>
        <ClassroomDashboard
          initialData={studentsResponse.data}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('[CLASSROOM_PAGE]', error)
    return <ErrorContent message="Erreur lors du chargement de la page" />
  }
}

export default ClassroomPage
