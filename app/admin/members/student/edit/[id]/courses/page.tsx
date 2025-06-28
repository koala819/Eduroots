import { Metadata } from 'next'

import { EditCourseStudent } from '@/client/components/root/EditStudentCourse'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'

export const metadata: Metadata = {
  title: 'Modifier info Cours pour l\'Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit/[id]/courses`,
  },
}

interface EditStudentCoursesPageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentCoursesPage({ params }: EditStudentCoursesPageProps) {
  const { id } = await params

  // Récupérer les données côté serveur
  const [courseData, teachersData] = await Promise.all([
    getStudentCourses(id),
    getAllTeachers(),
  ])

  if (!courseData.success || !teachersData.success || !courseData.data || !teachersData.data) {
    throw new Error(courseData.message)
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

  return (
    <EditCourseStudent
      studentId={id}
      initialData={{
        existingCourses: courseData.data,
        availableTeachers: teachersData.data,
        timeSlotConfigs,
      }}
    />
  )
}
