'use server'

import {AttendanceDocument} from '@/types/mongoose'

import {getAttendanceById} from '@/app/actions/context/attendances'
import {AttendancesProvider} from '@/context/Attendances/client'

interface AttendanceServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function AttendanceServerComponent({
  children,
  courseId,
}: AttendanceServerComponentProps) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialAttendanceData: AttendanceDocument[] | null = null

  if (courseId) {
    // Récupération des données avec typage explicite
    const response = await getAttendanceById(courseId, '')

    if (response.success && response.data) {
      // Traitement uniforme des données
      initialAttendanceData = Array.isArray(response.data)
        ? (response.data as any[])
        : ([response.data] as any[])
    }
  }

  return (
    <AttendancesProvider initialAttendanceData={initialAttendanceData}>
      {children}
    </AttendancesProvider>
  )
}
