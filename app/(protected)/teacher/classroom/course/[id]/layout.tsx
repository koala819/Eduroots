import { redirect } from 'next/navigation'

import { getCourseSessionById } from '@/server/actions/api/courses'

interface CourseLayoutProps {
  children: React.ReactNode
  params: Promise<{ id: string }>
}

export default async function CourseLayout({ children, params }: CourseLayoutProps) {
  const { id: courseSessionId } = await params

  // Récupérer le cours spécifique pour la navigation
  const courseResponse = await getCourseSessionById(courseSessionId)
  if (!courseResponse.success || !courseResponse.data) {
    redirect('/teacher/classroom')
  }

  const session = courseResponse.data

  return (
    <div data-course-id={courseSessionId} data-course-data={JSON.stringify(session)}>
      {children}
    </div>
  )
}
