import { Suspense } from 'react'

import { AttendanceCreate } from '@/client/components/atoms/AttendanceCreate'
import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { CourseSessionWithRelations } from '@/types/courses'

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
    console.log('🔄 [CreateAttendancePage] Chargement de la session:', courseSessionId)

    // Récupérer la session de cours
    const courseSessionRes = await getCourseSessionById(courseSessionId)
    if (!courseSessionRes.success || !courseSessionRes.data) {
      console.error('❌ [CreateAttendancePage] Session non trouvée:', courseSessionRes.message)
      return <ErrorComponent message="Session de cours non trouvée" />
    }

    console.log('✅ [CreateAttendancePage] Session chargée:', courseSessionRes.data)

    // Le courseSessionId est en fait l'ID de la session, pas du cours
    // On doit trouver la session correspondante dans le cours
    const session = courseSessionRes.data.courses_sessions.find(
      (s: any) => s.id === courseSessionId)

    if (!session) {
      console.error('❌ [CreateAttendancePage] Session non trouvée dans le cours')
      return <ErrorComponent message="Session non trouvée dans le cours" />
    }

    // Récupérer la liste des étudiants
    const students = session.courses_sessions_students
      ?.map((s: any) => s.users)
      .filter((user: any) => user !== null && user !== undefined) || []

    console.log('✅ [CreateAttendancePage] Étudiants récupérés:', students.length)

    // Préparer les données de session
    const courseSession: CourseSessionWithRelations = {
      ...session,
      courses_sessions_students: session.courses_sessions_students || [],
      courses_sessions_timeslot: session.courses_sessions_timeslot || [],
    }

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
