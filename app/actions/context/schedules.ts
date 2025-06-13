'use server'

import { createClient } from '@/utils/supabase/server'

import { ApiResponse } from '@/types/supabase/api'
import { SerializedValue, serializeData } from '@/lib/serialization'
import { createDefaultSchedule } from '@/utils/helpers'

interface SaveScheduleData {
  updatedBy: string
  [key: string]: any // pour les daySchedules
}

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user }
}

export async function getCurrentSchedule(userId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    // Cherche la config active la plus récente
    const { data: currentConfig, error } = await supabase
      .schema('education')
      .from('schedule_configs')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Si on trouve une config, on la renvoie
    if (currentConfig && !error) {
      return {
        success: true,
        data: serializeData(currentConfig),
        message: 'Schedule récupéré avec succès',
      }
    }

    const academicYear = new Date().getFullYear().toString()

    //Sinon création du document avec les valeurs par défaut
    const defaultConfig = createDefaultSchedule(academicYear, userId)

    return {
      success: true,
      data: serializeData(defaultConfig),
      message: 'Schedule créé avec valeurs par défaut',
    }
  } catch (error) {
    console.error('[GET_CURENT_SCHEDULES]', error)
    throw new Error('Erreur lors de la récupération des schedules')
  }
}

export async function saveSchedules(scheduleData: SaveScheduleData) {
  await getSessionServer()
  const supabase = await createClient()

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

    return {
      success: true,
      data: serializeData(scheduleConfig),
      message: 'Configuration des horaires enregistrée avec succès',
    }
  } catch (error) {
    console.error('[SAVE_SCHEDULES]', error)
    throw new Error('Erreur lors de la sauvegarde des schedules')
  }
}
