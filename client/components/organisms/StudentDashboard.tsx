'use client'

import { useEffect, useMemo, useState } from 'react'

import StudentSelector from '@/client/components/atoms/StudentSelector'
import ChildStats from '@/client/components/molecules/StudentStats'
import { useCourses } from '@/client/context/courses'
import { useStats } from '@/client/context/stats'
import { useTeachers } from '@/client/context/teachers'
import StudentDetailsSkeleton from '@/server/components/atoms/StudentDetailsSkeleton'
import { CourseWithRelations } from '@/types/courses'
import { User } from '@/types/db'
import { CourseStats, StudentStats } from '@/types/stats'
import { UserRoleEnum } from '@/types/user'

interface StudentDashboardProps {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
}

export default function StudentDashboard({ familyStudents }: Readonly<StudentDashboardProps>) {
  const { getCourseByIdForStudent } = useCourses()
  const { getStudentAttendance, getStudentGrade } = useStats()
  const { getOneTeacher } = useTeachers()

  const [selectedChildId, setSelectedChildId] = useState<string | null>()
  const [detailedAttendance, setDetailedAttendance] = useState<StudentStats>()
  const [detailedGrades, setDetailedGrades] = useState<CourseStats>()
  const [detailedCourse, setDetailedCourse] = useState<CourseWithRelations>()
  const [detailedTeacher, setDetailedTeacher] = useState<User & { role: UserRoleEnum.Teacher }>()
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

  async function loadTeacherAndCourseData(courseId: string) {
    const courseData = await getCourseByIdForStudent(courseId)
    if (!courseData?.courses_teacher) return

    const teacherId = Array.isArray(courseData.courses_teacher)
      ? courseData.courses_teacher[0]
      : courseData.courses_teacher
    const teacherData = await getOneTeacher(teacherId.users.id)

    if (teacherData) {
      setDetailedTeacher({
        ...teacherData,
        role: UserRoleEnum.Teacher,
        auth_id: teacherData.id,
        parent2_auth_id: null,
        secondary_email: null,
        is_active: true,
        deleted_at: null,
        date_of_birth: null,
        gender: null,
        type: null,
        subjects: null,
        school_year: null,
        stats_model: null,
        student_stats_id: null,
        teacher_stats_id: null,
        phone: null,
        created_at: null,
        updated_at: null,
        has_invalid_email: false,
      })
    }
    setDetailedCourse(courseData as CourseWithRelations)
  }

  async function loadDetailedStats(studentId: string) {
    if (!studentId) return

    setIsLoadingDetails(true)
    try {
      const [attendance, grades] = await Promise.all([
        getStudentAttendance(studentId),
        getStudentGrade(studentId),
      ])

      if (attendance?.success && attendance.data) {
        setDetailedAttendance(attendance.data)
      }

      if (grades?.success && grades.data) {
        setDetailedGrades(grades.data)
      }

      if (attendance?.success && attendance.data?.absences?.length > 0) {
        const courseId = attendance.data.absences[0].course
        await loadTeacherAndCourseData(courseId)
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
            detailedGrades={detailedGrades ?? { overallAverage: 0 }}
            detailedAttendance={{
              absencesCount: detailedAttendance?.absencesCount ?? 0,
              attendanceRate: detailedAttendance?.absencesRate ?? 0,
            }}
            detailedCourse={{
              sessions: detailedCourse?.courses_sessions.map((session) => ({
                ...session,
                timeSlot: session.courses_sessions_timeslot[0],
              })) ?? [],
            }}
            detailedTeacher={{
              firstname: detailedTeacher?.firstname ?? '',
              lastname: detailedTeacher?.lastname ?? '',
            }}
            subjectGradesData={subjectGradesData}
          />
        ))}
    </>
  )
}
