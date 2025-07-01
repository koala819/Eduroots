import { Metadata } from 'next'
import { Suspense } from 'react'

import { StudentEdit } from '@/client/components/admin/pages/StudentEdit'
import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getOneStudent } from '@/server/actions/api/students'
import { StudentEnrollment } from '@/types/courses'

export const metadata: Metadata = {
  title: 'Modifier un Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/edit`,
  },
}

interface EditStudentPageProps {
  params: Promise<{ id: string }>
}

export default async function EditStudentPage({ params }: EditStudentPageProps) {
  const { id } = await params
  try {
    const oneStudentData = await getOneStudent(id)

    if (!oneStudentData.success || !oneStudentData.data) {
      console.error(oneStudentData.message || 'Erreur lors de la récupération de l\'étudiant')
      return <ErrorContent message="Erreur lors du chargement des données de l'étudiant" />
    }

    const studentCoursesData = await getStudentCourses(id)

    // Gérer le cas où l'étudiant n'a pas de cours
    let sortedSessions: any[] = []

    if (studentCoursesData.success && studentCoursesData.data) {
      const enrollments = studentCoursesData.data as StudentEnrollment[]

      // Transformer les enrollments en structure attendue
      const transformedSessions = enrollments.map((enrollment) => {
        const session = enrollment.courses_sessions
        const course = session.courses
        const teacher = course.courses_teacher?.[0]?.users || {}
        const timeslot = session.courses_sessions_timeslot?.[0]

        return {
          session: {
            id: session.id,
            subject: session.subject,
            level: session.level,
            timeSlot: {
              day_of_week: timeslot?.day_of_week,
              startTime: timeslot?.start_time,
              endTime: timeslot?.end_time,
              classroom_number: timeslot?.classroom_number || undefined,
            },
          },
          teacher,
        }
      })

      // Utiliser la fonction de tri existante
      sortedSessions = transformedSessions
    } else if (!studentCoursesData.success &&
      studentCoursesData.message === 'Aucun cours trouvé pour cet étudiant') {
      // L'étudiant n'a pas de cours, c'est normal - on continue avec un tableau vide
      console.log('L\'étudiant n\'a pas encore de cours assignés')
    } else {
      // Vraie erreur lors de la récupération des cours
      console.error(studentCoursesData.message ||
        'Erreur lors de la récupération des cours de l\'étudiant')
      return <ErrorContent message="Erreur lors du chargement des cours de l'étudiant" />
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        <StudentEdit
          id={id}
          studentPersonalData={oneStudentData.data}
          studentCoursesData={sortedSessions}
        />
      </Suspense>)
  } catch (error) {
    console.error('Error in EditStudentPage:', error)
    return <ErrorContent message="Erreur lors du chargement des données de l'étudiant" />
  }
}
