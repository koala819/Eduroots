import { Suspense } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { TeacherGrades } from '@/client/components/pages/TeacherGrades'
import { getTeacherGrades } from '@/server/actions/api/grades'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

export default async function GradesPage() {
  const authUser = await getAuthenticatedUser()
  const teacherId = authUser ? await getEducationUserId(authUser.id) : null

  if (!teacherId) {
    return <ErrorContent message="Impossible de récupérer les informations de l'enseignant." />
  }

  try {
    const gradesResponse = await getTeacherGrades(teacherId)

    if (!gradesResponse.success) {
      const errorMessage = gradesResponse.message || 'Erreur lors de la récupération des notes.'
      return <ErrorContent message={errorMessage} />
    }

    return (
      <Suspense fallback={<LoadingContent />}>
        <TeacherGrades initialGrades={gradesResponse.data} />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur lors de la récupération des notes:', error)
    return <ErrorContent message="Erreur lors de la récupération des notes." />
  }
}
