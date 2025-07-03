'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { createDefaultSchedule, getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { SaveSchedulePayload } from '@/types/schedule-payload'

export async function getCurrentSchedule(userId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Cherche la config active la plus récente
    const { data: currentConfig, error } = await supabase
      .schema('education')
      .from('schedule_configs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    // Si on trouve une config ET qu'elle a des day_schedules, on la renvoie
    if (currentConfig && !error && currentConfig.day_schedules) {
      return {
        success: true,
        data: currentConfig,
        message: 'Schedule récupéré avec succès',
      }
    }

    // Si pas de config trouvée, pas de day_schedules, ou erreur, créer les valeurs par défaut
    const academicYear = new Date().getFullYear().toString()
    const defaultConfig = createDefaultSchedule(academicYear, userId)

    return {
      success: true,
      data: defaultConfig,
      message: 'Schedule créé avec valeurs par défaut',
    }
  } catch (error) {
    console.error('[GET_CURENT_SCHEDULES]', error)
    throw new Error('Erreur lors de la récupération des schedules')
  }
}

export async function saveSchedules(scheduleData: SaveSchedulePayload) {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  const currentYear = new Date().getFullYear().toString()
  const academicYear = `${currentYear}-${parseInt(currentYear) + 1}`

  const daySchedules = Object.fromEntries(
    Object.entries(scheduleData).filter(([key]) => key !== 'updatedBy'),
  )

  try {
    const { updatedBy } = scheduleData

    if (!daySchedules || !updatedBy) {
      return {
        success: false,
        message: 'Données manquantes',
        data: null,
      }
    }

    // D'abord désactiver les anciennes configs
    await supabase
      .schema('education')
      .from('schedule_configs')
      .update({ is_active: false })
      .eq('academic_year', academicYear)

    // Puis créer/mettre à jour la nouvelle config
    const { data: scheduleConfig, error } = await supabase
      .schema('education')
      .from('schedule_configs')
      .upsert({
        academic_year: academicYear,
        day_schedules: daySchedules,
        is_active: true,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }

    revalidatePath('/settings/schedules')
    revalidatePath('/settings')

    return {
      success: true,
      data: scheduleConfig,
      message: 'Configuration des horaires enregistrée avec succès',
    }
  } catch (error) {
    console.error('[SAVE_SCHEDULES]', error)
    throw new Error('Erreur lors de la sauvegarde des schedules')
  }
}
