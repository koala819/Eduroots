import { Metadata } from 'next'

import { StudentEdit } from '@/client/components/admin/pages/StudentEdit'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import { getStudentCourses } from '@/server/actions/api/courses'
import { getOneStudent } from '@/server/actions/api/students'
import { StudentEnrollment, TimeSlotEnum } from '@/types/courses'

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

    if (!studentCoursesData.success || !studentCoursesData.data) {
      console.error(studentCoursesData.message ||
        'Erreur lors de la récupération des cours de l\'étudiant')
      return <ErrorContent message="Erreur lors du chargement des cours de l'étudiant" />
    }

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

    // Trier les sessions
    const sortedSessions = transformedSessions.sort((a, b) => {
      const timeSlotOrder = {
        [TimeSlotEnum.SATURDAY_MORNING]: 0,
        [TimeSlotEnum.SATURDAY_AFTERNOON]: 1,
        [TimeSlotEnum.SUNDAY_MORNING]: 2,
      }

      const dayDiff =
            timeSlotOrder[a.session.timeSlot.day_of_week as TimeSlotEnum] -
            timeSlotOrder[b.session.timeSlot.day_of_week as TimeSlotEnum]

      if (dayDiff !== 0) return dayDiff

      const getMinutes = (time: string) => {
        const [hours, minutes] = time.split(':').map(Number)
        return hours * 60 + minutes
      }

      return getMinutes(a.session.timeSlot.startTime) - getMinutes(b.session.timeSlot.startTime)
    })

    return <StudentEdit
      id={id}
      studentPersonalData={oneStudentData.data}
      studentCoursesData={sortedSessions}
    />
  } catch (error) {
    console.error('Error in EditStudentPage:', error)
    return <ErrorContent message="Erreur lors du chargement des données de l'étudiant" />
  }

}
