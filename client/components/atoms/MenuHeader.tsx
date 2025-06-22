'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

import { ClassroomTimeSlot,CourseSessionWithRelations } from '@/types/courses'

import { CourseMenuDesktop } from './CourseMenu_Desktop'
import { CourseMenuMobile } from './CourseMenu_Mobile'

export function MenuHeader({
  classroomTimeSlots = [],
}: {
  classroomTimeSlots?: ClassroomTimeSlot[]
}) {
  const pathname = usePathname()
  const [courseData, setCourseData] = useState<{
    courseSessionId?: string
    selectedSession?: CourseSessionWithRelations
  }>({})

  useEffect(() => {
    // Détecter si on est sur /course/[id]
    const courseIdMatch = pathname.match(/\/classroom\/course\/([^/]+)/)

    if (courseIdMatch) {
      const courseSessionId = courseIdMatch[1]

      // Chercher les données du cours dans le DOM
      const courseElement = document.querySelector(`[data-course-id="${courseSessionId}"]`)
      if (courseElement) {
        const courseDataAttr = courseElement.getAttribute('data-course-data')
        if (courseDataAttr) {
          try {
            const selectedSession = JSON.parse(courseDataAttr)
            setCourseData({ courseSessionId, selectedSession })
          } catch (error) {
            console.error('Erreur parsing course data:', error)
          }
        }
      }
    } else {
      setCourseData({})
    }
  }, [pathname])

  // Détecter le type de sous-route pour adapter le menu
  const isAttendanceRoute = pathname.includes('/attendance')
  const isBehaviorRoute = pathname.includes('/behavior')
  const isClassroomRoute = pathname.includes('/profiles/classroom')

  // Détecter si on est sur un dashboard (pas sur create/edit)
  const isOnDashboard = (isAttendanceRoute || isBehaviorRoute) &&
    !pathname.includes('/create') &&
    !pathname.includes('/edit')

  // Logique pour déterminer le bouton retour
  const getReturnConfig = () => {
    // Si on est sur la page classroom dashboard
    if (isClassroomRoute) {
      return { name: 'Retour', url: '/teacher/profiles' }
    }

    if (!courseData.courseSessionId) {
      return { name: 'Accueil', url: '/teacher' }
    }

    // Si on est sur un dashboard (attendance ou behavior)
    if (isOnDashboard) {
      return { name: 'Mes Cours', url: '/teacher/classroom' }
    }

    // Si on est sur une page create/edit
    if (isAttendanceRoute || isBehaviorRoute) {
      const dashboardUrl = isAttendanceRoute
        ? `/teacher/classroom/course/${courseData.courseSessionId}/attendance`
        : `/teacher/classroom/course/${courseData.courseSessionId}/behavior`
      return { name: 'Retour', url: dashboardUrl }
    }

    // Par défaut (page cours principal)
    return { name: 'Mes Cours', url: '/teacher/classroom' }
  }

  const { name: returnBackName, url: returnBackUrl } = getReturnConfig()

  return (
    <>
      {/* Vue desktop */}
      <div className="hidden sm:flex">
        <CourseMenuDesktop
          returnBackName={returnBackName}
          returnBackUrl={returnBackUrl}
          courseSessionId={courseData.courseSessionId}
          selectedSession={courseData.selectedSession}
          showTabs={isOnDashboard}
          isClassroomRoute={isClassroomRoute}
          classroomTimeSlots={classroomTimeSlots}
        />
      </div>

      {/* Vue mobile */}
      <div className="sm:hidden">
        <CourseMenuMobile
          returnBackName={returnBackName}
          returnBackUrl={returnBackUrl}
          courseSessionId={courseData.courseSessionId}
          selectedSession={courseData.selectedSession}
          showTabs={isOnDashboard}
          isClassroomRoute={isClassroomRoute}
          classroomTimeSlots={classroomTimeSlots}
        />
      </div>
    </>
  )
}
