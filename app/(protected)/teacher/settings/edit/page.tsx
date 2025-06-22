import { getTeacherCourses } from '@/server/actions/api/courses'
import { getAuthenticatedUser, getEducationUserId } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { Holiday } from '@/types/holidays'

import { CoursesDisplay } from './CoursesDisplay'
import { HolidaysDisplay } from './HolidaysDisplay'

const PlanningViewer = async () => {
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

    // Récupérer toutes les données de la table education.holidays
    const { supabase } = await getSessionServer()
    const { data: allHolidays, error: holidaysError } = await supabase
      .schema('education')
      .from('holidays')
      .select('*')
      .order('created_at', { ascending: false })

    if (holidaysError) {
      console.error('[PLANNING_VIEWER] Error fetching all holidays:', holidaysError)
    }

    // Convertir les dates string en objets Date pour les vacances
    const convertedHolidays: Holiday[] = (allHolidays || []).map((holiday) => ({
      ...holiday,
      start_date: new Date(holiday.start_date),
      end_date: new Date(holiday.end_date),
      created_at: new Date(holiday.created_at),
      updated_at: new Date(holiday.updated_at),
    }))

    return (
      <div className="p-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CoursesDisplay courses={coursesResponse.data || []} />
          <HolidaysDisplay holidays={convertedHolidays} />
        </div>
      </div>
    )

  } catch (error) {
    console.error('[PLANNING_VIEWER] Error:', error)
    return <div>Erreur lors du chargement</div>
  }
}

export default PlanningViewer
