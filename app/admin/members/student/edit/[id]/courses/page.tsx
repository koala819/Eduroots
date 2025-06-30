import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { getCoursesWithStudentStats } from '@/server/actions/admin/student-courses-stats'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'
import { EditCourseStudent } from '@/zUnused/@oldEditStudentsTeachers/EditStudentCourse'

export const metadata: Metadata = {
  title: 'Modifier info Cours pour l\'Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit/[id]/courses`,
  },
}

interface EditStudentCoursesPageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentCoursesPage({
  params,
}: EditStudentCoursesPageProps) {
  const { id: studentId } = await params
  try {
    const [coursesData, teachersResponse, studentCoursesData] = await Promise.all([
      getCoursesWithStudentStats(),
      getAllTeachers(),
      getStudentCourses(studentId),
    ])

    if (!teachersResponse.success ||
      !teachersResponse.data ||
      !studentCoursesData.success ||
      !studentCoursesData.data) {
      throw new Error('Erreur lors de la récupération des données')
    }

    // Configuration des créneaux horaires
    const timeSlotConfigs = Object.entries(TIME_SLOT_SCHEDULE).map(([key, value]) => ({
      id: key as TimeSlotEnum,
      label: formatDayOfWeek(key as TimeSlotEnum),
      sessions: [
        { startTime: value.START, endTime: value.PAUSE },
        { startTime: value.PAUSE, endTime: value.FINISH },
      ],
    }))

    const allCoursesData = {
      existingCourses: coursesData,
      availableTeachers: teachersResponse.data,
      timeSlotConfigs,
    }

    return <EditCourseStudent
      studentId={studentId}
      allCoursesData={allCoursesData}
      studentCoursesData={studentCoursesData.data}
    />
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notFound()
  }
}
