import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { CreateGradeForm } from '@/client/components/pages/GradesFormCreate'
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

export default async function CreateGradePage() {
  const authUser = await getAuthenticatedUser()
  const teacherId = authUser ? await getEducationUserId(authUser.id) : null

  if (!teacherId) {
    return (
      <ErrorContent message="Impossible de récupérer les informations de l'enseignant." />
    )
  }

  try {
    const coursesResponse = await getTeacherCourses(teacherId)

    if (!coursesResponse.success) {
      const errorMessage = coursesResponse.message || 'Erreur lors de la récupération des cours.'
      return <ErrorContent message={errorMessage} />
    }

    // Vérifier si l'enseignant a des cours
    if (!coursesResponse.data || coursesResponse.data.length === 0) {
      return (
        <ErrorContent
          message={
            'Aucun cours disponible. Vous devez d\'abord créer des cours et des sessions ' +
            'avant de pouvoir créer des évaluations.'
          }
        />
      )
    }

    return (
      <Suspense fallback={<LoadingContent />}>
        <CreateGradeForm initialCourses={coursesResponse.data} />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des cours:', error)
    return <ErrorContent message="Erreur lors de la récupération des cours." />
  }
}
