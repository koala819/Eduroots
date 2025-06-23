import { Suspense } from 'react'

import { ErrorContent,LoadingContent } from '@/client/components/atoms/StatusContent'
import { TeacherGrades } from '@/client/components/pages/TeacherGrades'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

export default async function GradesPage() {
  const authUser = await getAuthenticatedUser()
  const teacherId = authUser ? await getEducationUserId(authUser.id) : null

  if (!teacherId) {
    return <ErrorContent message="Impossible de récupérer les informations de l'enseignant." />
  }

  return (
    <Suspense fallback={<LoadingContent />}>
      <TeacherGrades teacherId={teacherId} />
    </Suspense>
  )
}
