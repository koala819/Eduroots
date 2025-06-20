import { Suspense } from 'react'

import { AttendanceCreate } from '@/client/components/atoms/AttendanceCreate'
import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { convertToCourseSessionWithRelations,CourseSessionResponse } from '@/types/courses'

interface PageProps {
  params: Promise<{
    id: string
  }>
  searchParams: Promise<{
    date?: string
  }>
}

export default async function CreateAttendancePage({ params, searchParams }: PageProps) {
  const { id: courseSessionId } = await params
  const { date } = await searchParams

  if (!date) {
    return <ErrorComponent message="Date de session manquante" />
  }

  try {
    // Récupérer la session de cours
    const courseSessionRes = await getCourseSessionById(courseSessionId)

    if (!courseSessionRes.success || !courseSessionRes.data) {
      return <ErrorComponent message="Session de cours non trouvée" />
    }

    // courseSessionRes.data contient directement la session
    const session = courseSessionRes.data as CourseSessionResponse

    // Récupérer la liste des étudiants
    const students = session.courses_sessions_students
      ?.map((s) => s.users)
      .filter((user) => user !== null && user !== undefined) || []

    // Convertir en CourseSessionWithRelations
    const courseSession = convertToCourseSessionWithRelations(session)

    return (
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              Nouvelle Feuille des Présences
            </h1>
            <p className="text-muted-foreground">
              Session du {new Date(date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <Suspense fallback={<LoadingContent />}>
            <AttendanceCreate
              courseId={courseSessionId}
              students={students}
              date={date}
              initialData={{
                courseSession,
              }}
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ [CreateAttendancePage] Erreur:', error)
    return <ErrorComponent message="Une erreur inattendue s'est produite" />
  }
}
