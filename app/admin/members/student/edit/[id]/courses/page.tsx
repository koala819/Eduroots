import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EditCourseStudent } from '@/client/components/root/EditStudentCourse'
import { getCoursesWithStudentStats } from '@/server/actions/admin/student-courses-stats'
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

export default async function EditStudentCoursesPage({
  params,
}: EditStudentCoursesPageProps) {
  const { id: studentId } = await params

  try {
    // Récupérer les données avec la fonction simplifiée
    const [coursesData, teachersResponse] = await Promise.all([
      getCoursesWithStudentStats(),
      getAllTeachers(),
    ])

    if (!teachersResponse.success || !teachersResponse.data) {
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

    const initialData = {
      existingCourses: coursesData,
      availableTeachers: teachersResponse.data,
      timeSlotConfigs,
    }

    return <EditCourseStudent studentId={studentId} initialData={initialData} />
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notFound()
  }
}
