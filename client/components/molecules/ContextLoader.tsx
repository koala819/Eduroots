'use client'

import { useEffect, useState } from 'react'

import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { useAttendances } from '@/client/context/attendances'
import { useBehavior } from '@/client/context/behaviors'
import { useCourses } from '@/client/context/courses'
import { useGrades } from '@/client/context/grades'
import { useHolidays } from '@/client/context/holidays'
import { useSchedules } from '@/client/context/schedules'
import { useStats } from '@/client/context/stats'
import { useStudents } from '@/client/context/students'
import { useTeachers } from '@/client/context/teachers'

export default function GlobalLoadingIndicator() {
  const [isAnyLoading, setIsAnyLoading] = useState(true)
  const [loadingContexts, setLoadingContexts] = useState<string[]>([])

  const attendance = useAttendances()
  const stats = useStats()
  const teachers = useTeachers()
  const courses = useCourses()
  const students = useStudents()
  const behavior = useBehavior()
  const grades = useGrades()
  const holidays = useHolidays()
  const schedules = useSchedules()

  useEffect(() => {
    // console.log('Courses loading states:', {
    //   isLoading: courses.isLoading,
    //   isLoadingCourse: courses.isLoadingCourse,
    // })

    // Créer un objet pour suivre l'état de chaque contexte
    const loadingStateMap = {
      Présences: attendance.isLoading || attendance.isLoadingAttendance,
      Statistiques: stats.isLoading,
      Enseignants: teachers.isLoading,
      Cours: courses.isLoading || courses.isLoadingCourse,
      Étudiants: students.isLoading,
      Comportements: behavior.isLoading || behavior.isLoadingBehavior,
      Notes: grades.isLoading,
      Vacances: holidays.isLoading,
      'Emplois du temps': schedules.isLoading,
    }

    // Filtrer pour ne garder que les états à true
    const activeContexts = Object.entries(loadingStateMap)
      .filter(([_, value]) => value === true)
      .map(([key]) => key)

    setLoadingContexts(activeContexts)

    // Petit délai avant de déterminer qu'aucun contexte n'est en chargement
    // pour éviter le flash entre les composants
    if (activeContexts.length === 0) {
      const timer = setTimeout(() => {
        setIsAnyLoading(false)
      }, 100) // Délai de 100ms
      return () => clearTimeout(timer)
    } else {
      setIsAnyLoading(true)
    }
  }, [attendance, stats, teachers, courses, students, behavior, grades, holidays, schedules])

  if (!isAnyLoading) return null

  return (
    <LoadingContent

    />
  )
}
