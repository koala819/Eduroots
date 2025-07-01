import { Metadata } from 'next'
import { Suspense } from 'react'

import LoadingScreen from '@/client/components/atoms/LoadingScreen'
import { ErrorContent } from '@/client/components/atoms/StatusContent'
import NewStudentForm from '@/client/components/organisms/NewStudentForm'
import { getAllCoursesWithStats } from '@/server/actions/api/courses'
import { getCurrentSchedule } from '@/server/actions/api/schedules'
import { getAllTeachersWithStats } from '@/server/actions/api/teachers'
import { getAuthUser } from '@/server/actions/auth'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { DayScheduleWithType } from '@/types/schedule'

export const metadata: Metadata = {
  title: 'Création nouvel Elève',
  alternates: {
    canonical: `${process.env.CLIENT_URL}/admin/members/student/create`,
  },
}

export default async function CreatePage() {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthenticatedUser()
    const authResponse = await getAuthUser(user.id)

    if (!authResponse.success || !authResponse.data) {
      return <ErrorContent message="Erreur d'authentification" />
    }

    const userId = authResponse.data.educationUserId

    // Charger les données en parallèle
    const [teacherResponse, coursesResponse, schedulesResponse] = await Promise.all([
      getAllTeachersWithStats(),
      getAllCoursesWithStats(),
      getCurrentSchedule(userId),
    ])

    // Vérifier les réponses
    if (!teacherResponse.success || !teacherResponse.data) {
      return <ErrorContent message="Erreur lors de la récupération des professeurs" />
    }

    if (!coursesResponse.success || !coursesResponse.data) {
      return <ErrorContent message="Erreur lors de la récupération des cours" />
    }

    // Traiter les schedules
    let schedules: DayScheduleWithType[] | null = null
    if (schedulesResponse.success && schedulesResponse.data) {
      const data = schedulesResponse.data as any
      console.log('CreatePage - schedulesResponse.data:', data)

      // Gérer les deux formats possibles : day_schedules (DB) et daySchedules (default)
      const daySchedulesData = data.day_schedules || data.daySchedules
      console.log('CreatePage - daySchedulesData:', daySchedulesData)

      if (daySchedulesData && typeof daySchedulesData === 'object') {
        // Convertir l'objet en tableau avec dayType et periods
        schedules = Object.entries(daySchedulesData).map(([dayType, scheduleData]) => ({
          dayType,
          periods: (scheduleData as any).periods ?? [],
        }))
        console.log('CreatePage - processed schedules:', schedules)
      }
    } else {
      console.log('CreatePage - schedules response failed:', {
        success: schedulesResponse.success,
        data: schedulesResponse.data,
        message: schedulesResponse.message,
      })
    }

    return (
      <Suspense fallback={<LoadingScreen />}>
        <NewStudentForm
          teachers={teacherResponse.data}
          courses={coursesResponse.data}
          schedules={schedules}
        />
      </Suspense>
    )
  } catch (error) {
    console.error('Erreur dans CreatePage:', error)
    return <ErrorContent message="Une erreur est survenue lors du chargement des données" />
  }
}
