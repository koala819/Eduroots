import { Suspense } from 'react'

import { GradesClient } from '@/client/components/pages/TeacherGrades'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'

export default async function GradesPage() {
  const authUser = await getAuthenticatedUser()
  const teacherId = authUser ? await getEducationUserId(authUser.id) : null

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-red-500">
          Impossible de récupérer les informations de l&apos;enseignant.
        </p>
      </div>
    )
  }

  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      }
    >
      <GradesClient teacherId={teacherId} />
    </Suspense>
  )
}
