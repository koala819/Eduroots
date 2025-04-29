'use client'

import {BookOpenCheck, Menu} from 'lucide-react'
import {useSession} from 'next-auth/react'
import {useEffect, useState} from 'react'

import {useRouter} from 'next/navigation'

import {CourseMenu} from '@/components/atoms/client/CourseMenu'

import {useCourses} from '@/context/Courses/client'

export const CourseDisplay = () => {
  const router = useRouter()
  const {data: session} = useSession()
  const {getTeacherCourses, isLoading, teacherCourses} = useCourses()

  const [currentCourseId, setCurrentCourseId] = useState<string>('')
  const [isMenuVisible, setIsMenuVisible] = useState(false)

  useEffect(() => {
    if (session?.user?.id) {
      getTeacherCourses(session.user.id).then(() => setIsMenuVisible(true))
    }
  }, [session, getTeacherCourses])

  // Fonction pour gérer la navigation
  function handleCourseSelect(courseId: string) {
    setCurrentCourseId(courseId)
    router.push(`/teacher/classroom/course/${courseId}`)
  }

  // Pas de rendu si les cours ne sont pas chargés
  if (!teacherCourses || !isMenuVisible) return null

  if (teacherCourses.sessions.length === 0) {
    return <div>Aucun cours disponible</div>
  }

  // Chargement des cours...
  if (isLoading || (!teacherCourses && session?.user?.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-ping"
            style={{animationDelay: '0.2s'}}
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-ping"
            style={{animationDelay: '0.4s'}}
          ></div>
        </div>
        <p className="text-sm text-gray-500 animate-pulse">Chargement des cours...</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <BookOpenCheck className="w-12 h-12 mx-auto text-blue-500/80" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sélectionnez un cours</h3>
        <p className="text-sm text-gray-500 mb-4 text-center leading-relaxed">
          Cliquez sur le bouton
          <strong className="hidden sm:inline">&ldquo;Ouvrir le menu&ldquo;</strong>
          <Menu className="inline sm:hidden w-5 h-5" /> pour voir la liste des cours et gérer vos
          élèves.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
          <CourseMenu
            teacherCourses={teacherCourses}
            currentCourseId={currentCourseId}
            onCourseSelect={handleCourseSelect}
          />
        </div>
      </div>
    </div>
  )
}
