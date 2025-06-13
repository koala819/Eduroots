import { createClient } from '@/utils/supabase/server'
import { Metadata } from 'next'
import { getTeacherCourses } from '@/app/actions/context/courses'
import {
  LoadingContent,
  EmptyContent,
  CourseDisplay,
  ErrorContent,
} from '@/components/molecules/client/CourseDisplay'
import { Suspense } from 'react'
import { getAuthenticatedEducationUser } from '@/utils/auth-helpers'

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
      <Suspense fallback={<LoadingContent />}>
        {!coursesData || coursesData.length === 0 ? (
          <EmptyContent />
        ) : (
          <CourseDisplay
            initialCourses={coursesData}
          />
        )}
      </Suspense>
    )
  } catch (error) {
    console.error('[CLASSROOM_PAGE]', error)
    return <ErrorContent message="Une erreur inattendue s'est produite" />
  }
}
