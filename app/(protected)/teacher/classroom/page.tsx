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
import { TeacherCourseResponse } from '@/types/supabase/db'


export const metadata: Metadata = {
  title: 'Gestion des cours',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/teacher/classroom`,
  },
}

export default async function ClassroomPage() {
  const supabase = await createClient()

  // Récupérer l'utilisateur auth
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
  if (authError || !authUser) {
    return <ErrorContent message="Erreur d'authentification" />
  }

  // Récupérer l'utilisateur education
  const { data: educationUser, error: educationError } = await supabase
    .schema('education')
    .from('users')
    .select('id')
    .eq('auth_id', authUser.id)
    .single()

  if (educationError) {
    return <ErrorContent message="Erreur de récupération du profil" />
  }

  const courses = await getTeacherCourses(educationUser.id)
  const coursesData = courses.data as TeacherCourseResponse[] | null

  return (
    <Suspense fallback={<LoadingContent />}>
      {coursesData && coursesData.length === 0 ? (
        <EmptyContent />
      ) : (
        <CourseDisplay
          initialCourses={coursesData}
        />
      )}
    </Suspense>
  )
}
