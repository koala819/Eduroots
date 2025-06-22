
import { getCourseSessionById } from '@/server/actions/api/courses'

interface CourseLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
  const { id: courseSessionId } = await params

  // Récupérer le cours spécifique pour la navigation
  let session = null
  try {
    const courseResponse = await getCourseSessionById(courseSessionId)
    if (courseResponse.success && courseResponse.data) {
      session = courseResponse.data
    }
  } catch (error) {
    console.error('[COURSE_LAYOUT] Error loading session:', error)
    // Ne pas rediriger, laisser l'application continuer
  }

  return (
    <div data-course-id={courseSessionId} data-course-data={session ? JSON.stringify(session) : ''}>
      {children}
    </div>
  )
}
