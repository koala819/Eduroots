'use client'

import {Loader} from 'lucide-react'
import {useEffect, useState} from 'react'

import {useAttendance} from '@/context/Attendances/client'
import {useBehavior} from '@/context/Behaviors/client'
import {useCourses} from '@/context/Courses/client'
import {useGrades} from '@/context/Grades/client'
import {useHolidays} from '@/context/Holidays/client'
import {useSchedules} from '@/context/Schedules/client'
import {useStats} from '@/context/Stats/client'
import {useStudents} from '@/context/Students/client'
import {useTeachers} from '@/context/Teachers/client'
import {motion} from 'framer-motion'

export default function GlobalLoadingIndicator() {
  const [isAnyLoading, setIsAnyLoading] = useState(true)
  const [loadingContexts, setLoadingContexts] = useState<string[]>([])

  const attendance = useAttendance()
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
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-2xl shadow-lg flex flex-col items-center space-y-4">
        <motion.div
          initial={{rotate: 0}}
          animate={{rotate: 360}}
          transition={{repeat: Infinity, duration: 1, ease: 'linear'}}
        >
          <Loader className="h-12 w-12 text-primary" />
        </motion.div>
        <p className="text-lg font-semibold text-gray-700 text-center">Chargement en cours...</p>
        {loadingContexts.length > 0 && (
          <p className="text-sm text-gray-500 text-center">
            En attente : {loadingContexts.join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
