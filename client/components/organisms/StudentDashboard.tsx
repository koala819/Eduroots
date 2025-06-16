'use client'

import { useEffect, useMemo, useState } from 'react'

import { PopulatedCourse } from '@/zUnused/mongo/course'
import { CourseStats, StudentStats } from '@/zUnused/mongo/stats'
import { Student, Teacher } from '@/zUnused/mongo/user'

import StudentSelector from '@/client//components/atoms/StudentSelector'
import StudentDetailsSkeleton from '@/server/components/atoms/StudentDetailsSkeleton'
import ChildStats from '@/client//components/molecules/StudentStats'

import { useCourses } from '@/client/context/courses'
import { useStats } from '@/client/context/stats'
import { useTeachers } from '@/client/context/teachers'

interface StudentDashboardProps {
  familyStudents: Student[]
}

export default function StudentDashboard({ familyStudents }: StudentDashboardProps) {
  const { getCourseByIdForStudent } = useCourses()
  const { getStudentAttendance, getStudentBehavior, getStudentGrade } = useStats()
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
    }
  }, [selectedChildId])

  const subjectGradesData = useMemo(() => {
    if (!detailedGrades?.bySubject) return []

    return Object.entries(detailedGrades.bySubject).map(([subject, data]) => {
      const average = typeof data === 'object' && 'average' in data ? data.average : 'N/A'

      let grades: number[] = []
      if (typeof data === 'object' && 'grades' in data && Array.isArray(data.grades)) {
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
      const [attendance, behavior, grades] = await Promise.all([
        getStudentAttendance(studentId),
        getStudentBehavior(studentId),
        getStudentGrade(studentId),
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

      // Récupérer les informations du cours si nous avons des données d'assiduité
      if (attendance?.success && attendance.data && attendance.data.absences?.length > 0) {
        const courseId = attendance.data.absences[0].course
        const courseData = await getCourseByIdForStudent(courseId)
        if (courseData?.courses_teacher) {
          const teacherId = Array.isArray(courseData.courses_teacher)
            ? courseData.courses_teacher[0]
            : courseData.courses_teacher
          const teacherData = await getOneTeacher(teacherId.users.id)
          setDetailedTeacher(teacherData)
        }
        setDetailedCourse(courseData as unknown as PopulatedCourse)
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
        <h2 className="text-sm font-semibold text-slate-500 mb-3">Choisir un enfant</h2>
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
