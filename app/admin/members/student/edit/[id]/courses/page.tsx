import { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { EditCourseStudent } from '@/client/components/admin/molecules/EditStudentCourse'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { getCoursesWithStudentStats } from '@/server/actions/admin/student-courses-stats'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getAllTeachers } from '@/server/actions/api/teachers'
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

    // Préparer les données d'inscription actuelles côté serveur
    const currentEnrollments = new Set<string>()
    const initialSelections = new Map<string, string>()

    studentCoursesData.data.forEach((enrollment) => {
      const sessionId = enrollment.courses_sessions.id
      currentEnrollments.add(sessionId)

      // Créer une clé de session basée sur le créneau horaire
      const timeSlot = enrollment.courses_sessions.courses_sessions_timeslot?.[0]
      if (timeSlot) {
        const sessionKey = `${timeSlot.start_time}-${timeSlot.end_time}`
        initialSelections.set(sessionKey, sessionId)
      }
    })

    const allCoursesData = {
      existingCourses: coursesData,
      availableTeachers: teachersResponse.data,
      timeSlotConfigs,
    }

    // Données d'inscription préparées
    const enrollmentData = {
      currentEnrollments: Array.from(currentEnrollments),
      initialSelections: Object.fromEntries(initialSelections),
    }

    return <EditCourseStudent
      allCoursesData={allCoursesData}
      studentCoursesData={studentCoursesData.data}
      enrollmentData={enrollmentData}
    />
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notFound()
  }
}
