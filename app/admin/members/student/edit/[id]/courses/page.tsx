import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { EditCourseStudent } from '@/client/components/admin/molecules/EditStudentCourse'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { getCoursesWithStudentStats } from '@/server/actions/admin/student-courses-stats'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getAllTeachers } from '@/server/actions/api/teachers'
import { StudentEnrollment, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/types/courses'

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

    if (!teachersResponse.success || !teachersResponse.data) {
      throw new Error('Erreur lors de la récupération des données des enseignants')
    }

    // Gérer le cas où l'étudiant n'a pas de cours
    let currentEnrollments = new Set<string>()
    let initialSelections = new Map<string, string>()
    let studentCourses: StudentEnrollment[] = []

    if (studentCoursesData.success && studentCoursesData.data) {
      studentCourses = studentCoursesData.data

      // Préparer les données d'inscription actuelles côté serveur
      studentCourses.forEach((enrollment) => {
        const sessionId = enrollment.courses_sessions.id
        currentEnrollments.add(sessionId)

        // Créer une clé de session basée sur le créneau horaire
        const timeSlot = enrollment.courses_sessions.courses_sessions_timeslot?.[0]
        if (timeSlot) {
          const sessionKey = `${timeSlot.start_time}-${timeSlot.end_time}`
          initialSelections.set(sessionKey, sessionId)
        }
      })
    } else if (!studentCoursesData.success &&
      studentCoursesData.message === 'Aucun cours trouvé pour cet étudiant') {
      // L'étudiant n'a pas de cours, c'est normal - on continue avec des ensembles vides
      console.log('L\'étudiant n\'a pas encore de cours assignés')
    } else {
      // Vraie erreur lors de la récupération des cours
      throw new Error('Erreur lors de la récupération des cours de l\'étudiant')
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

    // Données d'inscription préparées
    const enrollmentData = {
      currentEnrollments: Array.from(currentEnrollments),
      initialSelections: Object.fromEntries(initialSelections),
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        <EditCourseStudent
          allCoursesData={allCoursesData}
          studentCoursesData={studentCourses}
          enrollmentData={enrollmentData}
          studentId={studentId}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur lors du chargement des données:', error)
    notFound()
  }
}
