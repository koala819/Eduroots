import { redirect } from 'next/navigation'

import { CourseMenuDesktop } from '@/client/components/atoms/CourseMenu_Desktop'
import { CourseMenuMobile } from '@/client/components/atoms/CourseMenu_Mobile'
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
    <div className="flex flex-col h-full bg-muted">
      <header className="sticky top-0 z-30">
        {/* Vue desktop */}
        <div className="hidden sm:flex">
          <CourseMenuDesktop
            courseSessionId={courseSessionId}
            selectedSession={session}
          />
        </div>

        {/* Vue mobile */}
        <div className="sm:hidden">
          <CourseMenuMobile
            courseSessionId={courseSessionId}
            selectedSession={session}
          />
        </div>
      </header>

      <div className="flex-1 p-4 overflow-auto pb-20 sm:pb-4 mt-20">
        <div className="max-w-[1200px] mx-auto bg-background rounded-lg shadow-sm">
          {children}
        </div>
      </div>
    </div>
  )
}
