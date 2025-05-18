'use client'

import { BookOpenCheck, Menu } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { useRouter } from 'next/navigation'

import { CourseMenu } from '@/components/atoms/client/CourseMenu'

import { useCourses } from '@/context/Courses/client'
import useCourseStore from '@/stores/useCourseStore'

export const CourseDisplay = () => {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { isLoading } = useCourses()
  const { courses, fetchTeacherCourses } = useCourseStore()

  const [currentCourseId, setCurrentCourseId] = useState<string>('')
  const [isMenuVisible, setIsMenuVisible] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadCourses = async () => {
      if (session?.user?.id) {
        try {
          await fetchTeacherCourses(session.user.id)
          setIsMenuVisible(true)
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : 'Erreur lors de la récupération des cours',
          )
        }
      }
    }

    if (status === 'authenticated' && !isMenuVisible) {
      loadCourses()
    }
  }, [status, session?.user?.id, fetchTeacherCourses, isMenuVisible])

  const handleCourseSelect = useCallback(
    (courseId: string) => {
      setCurrentCourseId(courseId)
      router.push(`/teacher/classroom/course/${courseId}`)
    },
    [router],
  )

  const loadingContent = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-ping"></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-ping"
            style={{ animationDelay: '0.2s' }}
          ></div>
          <div
            className="w-3 h-3 bg-blue-500 rounded-full animate-ping"
            style={{ animationDelay: '0.4s' }}
          ></div>
        </div>
        <p className="text-sm text-gray-500 animate-pulse">
          Chargement des cours...
        </p>
      </div>
    ),
    [],
  )

  const errorContent = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50">
        <div className="text-red-500 mb-4">
          <svg
            className="w-12 h-12 mx-auto"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <p className="text-red-600 font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Réessayer
        </button>
      </div>
    ),
    [error],
  )

  const emptyContent = useMemo(
    () => (
      <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50">
        <BookOpenCheck className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Aucun cours disponible
        </h3>
        <p className="text-sm text-gray-500 text-center max-w-md">
          Vous n&apos;avez pas encore de cours assignés. Contactez
          l&apos;administration pour plus d&apos;informations.
        </p>
      </div>
    ),
    [],
  )

  if (isLoading || !isMenuVisible) {
    return loadingContent
  }

  if (error) {
    return errorContent
  }

  if (!courses || courses.length === 0) {
    return emptyContent
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] bg-gradient-to-b from-white to-gray-50 p-4">
      <div className="text-center max-w-md mx-auto">
        <div className="mb-6">
          <BookOpenCheck className="w-12 h-12 mx-auto text-blue-500/80" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Sélectionnez un cours
        </h3>
        <p className="text-sm text-gray-500 mb-4 text-center leading-relaxed">
          Cliquez sur le bouton
          <strong className="hidden sm:inline">
            &ldquo;Ouvrir le menu&rdquo;
          </strong>
          <Menu className="inline sm:hidden w-5 h-5" /> pour voir la liste des
          cours et gérer vos élèves.
        </p>

        <div className="flex items-center justify-center gap-2 text-sm text-blue-500">
          <CourseMenu
            courses={courses}
            currentCourseId={currentCourseId}
            onCourseSelect={handleCourseSelect}
          />
        </div>
      </div>
    </div>
  )
}
