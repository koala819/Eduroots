'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { createDefaultHolidays,getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { SaveHolidayPayload } from '@/types/holiday-payload'


export async function getCurrentHolidays(userId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Cherche la config active la plus récente
    const { data: currentConfig, error } = await supabase
      .schema('education')
      .from('holidays')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Si on trouve une config, on la renvoie
    if (currentConfig && !error) {
      return {
        success: true,
        data: currentConfig,
        message: 'Vacances récupérées avec succès',
      }
    }

    // Sinon on crée une nouvelle config avec les valeurs par défaut
    const academicYear = new Date().getFullYear().toString()
    const defaultConfig = createDefaultHolidays(academicYear, userId)

    return {
      success: true,
      data: defaultConfig,
      message: 'Création de la config de vacances avec succès',
    }
  } catch (error) {
    console.error('[GET_HOLIDAYS]', error)
    throw new Error('Erreur lors de la récupération des vacances')
  }
}

export async function saveHolidays(
  holidayData: SaveHolidayPayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()
  const currentYear = new Date().getFullYear().toString()
  const academicYear = `${currentYear}-${parseInt(currentYear) + 1}`

  try {
    const { holidays, updatedBy } = holidayData

    if (!holidays || !updatedBy) {
      return {
        success: false,
        message: 'Données manquantes',
        data: null,
      }
    }

    // D'abord désactiver les anciennes configs
    await supabase
      .schema('education')
      .from('holidays')
      .update({ is_active: false })
      .eq('academic_year', academicYear)

    // Puis créer/mettre à jour la nouvelle config
    const { data: holidaySchedule, error } = await supabase
      .schema('education')
      .from('holidays')
      .upsert({
        academic_year: academicYear,
        holidays_data: holidays,
        is_active: true,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la sauvegarde: ${error.message}`)
    }

    revalidatePath('/settings/holidays')
    revalidatePath('/settings')

    return {
      success: true,
      data: holidaySchedule,
      message: 'Configuration des vacances enregistrée avec succès',
    }
  } catch (error) {
    console.error('[SAVE_HOLIDAYS]', error)
    throw new Error('Erreur lors de la sauvegarde des vacances')
  }
}
