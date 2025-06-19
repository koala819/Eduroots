import { Suspense } from 'react'

import { AttendanceEdit } from '@/client/components/atoms/AttendanceEdit'
import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { getAttendanceById } from '@/server/actions/api/attendances'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { CourseSessionWithRelations } from '@/types/courses'
import { User } from '@/types/db'

interface PageProps {
  params: Promise<{
    id: string
    attendanceId: string
  }>
  searchParams: Promise<{
    date?: string
  }>
}

export default async function EditAttendancePage({ params, searchParams }: PageProps) {
  const { id: courseSessionId, attendanceId } = await params
  const { date } = await searchParams

  if (!date) {
    return <ErrorComponent message="Date de session manquante" />
  }

  try {
    // Récupérer la session de cours
    const courseSessionRes = await getCourseSessionById(courseSessionId)
    if (!courseSessionRes.success || !courseSessionRes.data) {
      console.error('❌ [EditAttendancePage] Session non trouvée:', courseSessionRes.message)
      return <ErrorComponent message="Session de cours non trouvée" />
    }

    const courseData = courseSessionRes.data.courses_sessions?.[0] || courseSessionRes.data

    if (!courseData) {
      console.error('❌ [EditAttendancePage] Données de session invalides')
      return <ErrorComponent message="Données de session invalides" />
    }

    // Récupérer la feuille de présence
    const attendanceRes = await getAttendanceById(courseData.course_id, date)
    if (!attendanceRes.success) {
      console.error('❌ [EditAttendancePage] Erreur récupération attendance:', attendanceRes.message)
      return <ErrorComponent message="Erreur lors de la récupération des données de présence" />
    }

    // Récupérer la liste des étudiants
    const students = courseData.courses_sessions_students
      ?.map((s: any) => s.users)
      .filter((user: any) => user !== null && user !== undefined) || []

    // Préparer les données de session
    const courseSession: CourseSessionWithRelations = {
      ...courseData,
      courses_sessions_students: courseData.courses_sessions_students || [],
      courses_sessions_timeslot: courseData.courses_sessions_timeslot || null,
    }

    // Mapper les records d'attendance
    let attendanceRecords: { [key: string]: boolean } = {}
    const attendance = attendanceRes.data

    if (attendance?.attendance_records && attendance.attendance_records.length > 0) {
      attendanceRecords = attendance.attendance_records.reduce(
        (acc: { [x: string]: boolean },
          record: { student_id: string; is_present: boolean }) => {
          acc[record.student_id] = record.is_present
          return acc
        },
        {} as { [key: string]: boolean },
      )
    } else {
      // Initialiser avec tous les étudiants à false si aucun record trouvé
      attendanceRecords = students.reduce(
        (acc: { [key: string]: boolean }, student: User) => ({
          ...acc,
          [student.id]: false,
        }),
        {} as { [key: string]: boolean },
      )
    }

    return (
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              Modifier la Feuille des Présences
            </h1>
            <p className="text-muted-foreground">
              Session du {new Date(date).toLocaleDateString('fr-FR', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          <Suspense fallback={<LoadingContent />}>
            <AttendanceEdit
              courseSessionId={courseSessionId}
              date={date}
              attendanceId={attendance?.id || attendanceId}
              students={students}
              initialData={{
                courseSession,
                attendanceRecords,
                attendanceId: attendance?.id || attendanceId,
              }}
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    console.error('❌ [EditAttendancePage] Erreur:', error)
    return <ErrorComponent message="Une erreur inattendue s'est produite" />
  }
}
