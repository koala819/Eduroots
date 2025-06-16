'use server'

import { Attendance } from '@/types/db'

import { getAttendanceById } from '@/server/actions/api/attendances'
import { AttendancesProvider } from '@/client/context/attendances'

interface AttendanceServerComponentProps {
  children: React.ReactNode
  courseId?: string
}

export default async function AttendanceServerComponent({
  children,
  courseId,
}: Readonly<AttendanceServerComponentProps>) {
  // Si un courseId est fourni, on pré-charge les données pour ce cours
  let initialAttendanceData: Attendance[] | null = null

  if (courseId) {
    // Récupération des données avec typage explicite
    const response = await getAttendanceById(courseId, '')

    if (response.success && response.data) {
      // Traitement uniforme des données
      initialAttendanceData = Array.isArray(response.data)
        ? (response.data as Attendance[])
        : ([response.data] as Attendance[])
    }
  }

  return (
    <AttendancesProvider initialAttendanceData={initialAttendanceData}>
      {children}
    </AttendancesProvider>
  )
}
