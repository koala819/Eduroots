import { createClient } from '@/utils/supabase/server'
import { Metadata } from 'next'
import { getTeacherCourses } from '@/app/actions/context/courses'
import { Suspense } from 'react'
import { getAuthenticatedEducationUser } from '@/utils/auth-helpers'
import { CourseGrid } from '@/components/molecules/client/CourseGrid'
import {
  LoadingContent,
  EmptyContent,
  ErrorContent,
} from '@/components/atoms/client/StatusContent'

export const metadata: Metadata = {
  title: 'Gestion des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/teacher/classroom`,
  },
}

export default async function ClassroomPage() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { isAuthenticated, role, educationUserId, error: authError } =
      await getAuthenticatedEducationUser(user)

    if (!isAuthenticated || !educationUserId || role !== 'teacher') {
      return <ErrorContent message={authError || "Vous n'avez pas les droits nécessaires"} />
    }

    const coursesResponse = await getTeacherCourses(educationUserId)

    if (!coursesResponse.success) {
      return <ErrorContent message={coursesResponse.message} />
    }

    const coursesData = coursesResponse.data

    return (
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mes Cours</h1>
          <p className="text-gray-500 mt-1">
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
