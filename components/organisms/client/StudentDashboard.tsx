'use client'

import { useEffect, useMemo, useState } from 'react'

import { PopulatedCourse } from '@/types/course'
import { CourseStats, StudentStats } from '@/types/stats'
import { Student, Teacher } from '@/types/user'

import StudentSelector from '@/components/atoms/client/StudentSelector'
import StudentDetailsSkeleton from '@/components/atoms/server/StudentDetailsSkeleton'
import ChildStats from '@/components/molecules/client/StudentStats'

import { useCourses } from '@/context/Courses/client'
import { useStats } from '@/context/Stats/client'
import { useTeachers } from '@/context/Teachers/client'

interface StudentDashboardProps {
  familyStudents: Student[]
}

export default function StudentDashboard({
  familyStudents,
}: StudentDashboardProps) {
  const { getCourseByIdForStudent, getStudentCourses } = useCourses()
  const { getStudentAttendance, getStudentBehavior, getStudentGrade } =
    useStats()
  const { getOneTeacher } = useTeachers()

  const [selectedChildId, setSelectedChildId] = useState<string | null>()
  const [detailedAttendance, setDetailedAttendance] = useState<StudentStats>()
  const [detailedBehavior, setDetailedBehavior] = useState<StudentStats>()
  const [detailedGrades, setDetailedGrades] = useState<CourseStats>()
  const [detailedCourse, setDetailedCourse] = useState<PopulatedCourse>()
  const [detailedTeacher, setDetailedTeacher] = useState<Teacher>()
  const [isLoadingDetails, setIsLoadingDetails] = useState<boolean>(false)

  useEffect(() => {
    if (selectedChildId) {
      loadDetailedStats(selectedChildId)
    } else {
      // Réinitialiser les états quand aucun enfant n'est sélectionné
      setDetailedAttendance(undefined)
      setDetailedBehavior(undefined)
      setDetailedGrades(undefined)
      setDetailedCourse(undefined)
      setDetailedTeacher(undefined)
    }
  }, [selectedChildId])

  const subjectGradesData = useMemo(() => {
    if (!detailedGrades?.bySubject) return []

    return Object.entries(detailedGrades.bySubject).map(([subject, data]) => {
      const average =
        typeof data === 'object' && 'average' in data ? data.average : 'N/A'

      let grades: number[] = []
      if (
        typeof data === 'object' &&
        'grades' in data &&
        Array.isArray(data.grades)
      ) {
        grades = data.grades.filter((grade) => typeof grade === 'number')
      }

      return {
        subject,
        average,
        grades,
      }
    })
  }, [detailedGrades])

  async function loadDetailedStats(studentId: string) {
    if (!studentId) return

    setIsLoadingDetails(true)
    try {
      const [attendance, behavior, grades, courses] = await Promise.all([
        getStudentAttendance(studentId),
        getStudentBehavior(studentId),
        getStudentGrade(studentId),
        getStudentCourses(studentId),
      ])

      if (attendance?.success && attendance.data) {
        setDetailedAttendance(attendance.data)
      }

      if (behavior?.success && behavior.data) {
        setDetailedBehavior(behavior.data)
      }

      if (grades?.success && grades.data) {
        setDetailedGrades(grades.data)
      }

      // Récupérer les informations du cours pour l'étudiant
      if (courses && courses.length > 0) {
        const courseData = courses[0]
        if (courseData?.teacher) {
          setDetailedTeacher(courseData.teacher)
        }
        setDetailedCourse(courseData)
      }
    } catch (error) {
      console.error('Erreur lors du chargement des données détaillées:', error)
    } finally {
      setIsLoadingDetails(false)
    }
  }

  return (
    <>
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">
          Choisir un enfant
        </h2>
        <StudentSelector
          familyStudents={familyStudents}
          selectedChildId={selectedChildId}
          onSelectStudent={setSelectedChildId}
        />
      </section>

      {selectedChildId &&
        (isLoadingDetails ? (
          <StudentDetailsSkeleton />
        ) : (
          <ChildStats
            detailedGrades={detailedGrades}
            detailedAttendance={detailedAttendance}
            detailedBehavior={detailedBehavior}
            detailedCourse={detailedCourse}
            detailedTeacher={detailedTeacher}
            subjectGradesData={subjectGradesData}
          />
        ))}
    </>
  )
}
