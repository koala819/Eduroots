import { HolidaysList } from '@/client/components/atoms/HolidaysList'
import { TeacherScheduleSection } from '@/client/components/organisms/TeacherScheduleSection'
import { getTeacherCourses } from '@/server/actions/api/courses'
import { getAllHolidays } from '@/server/actions/api/holidays'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'
import { Holiday } from '@/types/holidays'

export default async function PlanningViewerPage() {
  try {
    // Récupérer l'utilisateur authentifié
    const user = await getAuthenticatedUser()
    const educationUserId = await getEducationUserId(user.id)

    if (!educationUserId) {
      console.error('[PLANNING_VIEWER] User not found in education.users')
      return <div>Utilisateur non trouvé</div>
    }

    // Récupérer les cours du professeur
    const coursesResponse = await getTeacherCourses(educationUserId)

    // Récupérer toutes les vacances
    const holidaysResponse = await getAllHolidays()

    let convertedHolidays: Holiday[] = []

    if (holidaysResponse.success && holidaysResponse.data) {
      convertedHolidays = holidaysResponse.data.map((holiday: Holiday) => ({
        ...holiday,
        start_date: new Date(holiday.start_date),
        end_date: new Date(holiday.end_date),
        created_at: new Date(holiday.created_at),
        updated_at: new Date(holiday.updated_at),
      }))
    }

    return (
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TeacherScheduleSection courses={coursesResponse.data || []} />
          <HolidaysList holidays={convertedHolidays} />
        </div>
      </div>
    )

  } catch (error) {
    console.error('[PLANNING_VIEWER] Error:', error)
    return <div>Erreur lors du chargement</div>
  }
}

