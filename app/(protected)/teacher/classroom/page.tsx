import { Metadata } from 'next'
import { Suspense } from 'react'

import {
  EmptyContent,
  ErrorContent,
  LoadingContent,
} from '@/client/components/atoms/StatusContent'
import { CourseGrid } from '@/client/components/molecules/CourseGrid'
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getAuthenticatedEducationUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'

export const metadata: Metadata = {
  title: 'Gestion des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/teacher/classroom`,
  },
}

export default async function ClassroomPage() {
  try {
    const { user } = await getSessionServer()

    const { isAuthenticated, role, educationUserId, error: authError } =
      await getAuthenticatedEducationUser(user)

    if (!isAuthenticated || !educationUserId || role !== 'teacher') {
      return <ErrorContent message={authError || 'Vous n\'avez pas les droits nécessaires'} />
    }

    const coursesResponse = await getTeacherCourses(educationUserId)

    if (!coursesResponse.success) {
      return <ErrorContent message={coursesResponse.message} />
    }

    const coursesData = coursesResponse.data

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">Mes Cours</h1>
          <p className="text-muted-foreground mt-1">
            Gérez vos cours et suivez la progression de vos élèves
          </p>
        </div>

        <Suspense fallback={<LoadingContent />}>
          {!coursesData || coursesData.length === 0 ? (
            <EmptyContent />
          ) : (
            <CourseGrid courses={coursesData} />
          )}
        </Suspense>
      </div>
    )
  } catch (error) {
    console.error('[CLASSROOM_PAGE]', error)
    return <ErrorContent message="Une erreur inattendue s'est produite" />
  }
}
