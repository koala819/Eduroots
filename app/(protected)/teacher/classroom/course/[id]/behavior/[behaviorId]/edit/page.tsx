import { notFound } from 'next/navigation'
import { Suspense } from 'react'

import { BehaviorEdit } from '@/client/components/atoms/BehaviorEdit'
import { ErrorComponent } from '@/client/components/atoms/ErrorComponent'
import { LoadingContent } from '@/client/components/atoms/StatusContent'
import { getAttendanceById } from '@/server/actions/api/attendances'
import { getBehaviorByIdAndDate } from '@/server/actions/api/behaviors'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { AttendanceRecord } from '@/types/db'

interface PageProps {
  params: Promise<{
    id: string
    behaviorId: string
  }>
  searchParams: Promise<{
    date?: string
  }>
}

export default async function BehaviorEditPage({ params, searchParams }: PageProps) {
  const [{ id: courseSessionId, behaviorId }, { date }] = await Promise.all([params, searchParams])

  if (!date) {
    notFound()
  }

  try {
    const courseResponse = await getCourseSessionById(courseSessionId)
    if (!courseResponse.success || !courseResponse.data) {
      return <ErrorComponent message={courseResponse.message} />
    }

    const courseId = courseResponse.data.courses.id
    const [attendanceResponse, behaviorResponse] = await Promise.all([
      getAttendanceById(courseId, date),
      getBehaviorByIdAndDate(courseId, date),
    ])

    if (!attendanceResponse.success || !attendanceResponse.data) {
      return <ErrorComponent message="Aucune présence trouvée pour cette date" />
    }

    if (!behaviorResponse.success || !behaviorResponse.data) {
      return <ErrorComponent message="Aucun comportement trouvé pour cette date" />
    }

    // Récupérer les IDs des étudiants présents
    const presentStudentIds = attendanceResponse.data.attendance_records
      .filter((record: AttendanceRecord) => record.is_present)
      .map((record: AttendanceRecord) => record.student_id)

    // Filtrer les étudiants présents depuis les données du cours
    const presentStudents = courseResponse.data.courses_sessions_students
      ?.filter((studentRelation: any) =>
        presentStudentIds.includes(studentRelation.student_id) && studentRelation.users,
      )
      .map((studentRelation: any) => studentRelation.users)
      .filter(Boolean) || []

    // Préparer les données de comportement existantes
    const behaviorRecords: { [key: string]: number } = {}
    if (behaviorResponse.data.records) {
      behaviorResponse.data.records.forEach((record: any) => {
        behaviorRecords[record.student_id] = record.rating
      })
    }

    // Initialiser les notes par défaut pour les étudiants sans données
    presentStudents.forEach((student: any) => {
      if (!behaviorRecords[student.id]) {
        behaviorRecords[student.id] = 5 // Note par défaut
      }
    })

    return (
      <div className="container mx-auto py-4 sm:py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary mb-2">
              Modifier la Feuille de Comportement
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
            <BehaviorEdit
              courseSessionId={courseSessionId}
              date={date}
              behaviorId={behaviorId}
              students={presentStudents}
              initialData={{
                courseSession: courseResponse.data,
                behaviorRecords: behaviorRecords,
                behaviorId: behaviorId,
              }}
            />
          </Suspense>
        </div>
      </div>
    )
  } catch (error) {
    return <ErrorComponent message="Erreur lors du chargement des données" />
  }
}
