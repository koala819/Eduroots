'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { createDefaultHolidays, getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { SaveHolidayPayload } from '@/types/holiday-payload'
import { Holiday } from '@/types/holidays'

export async function getAllHolidays(): Promise<ApiResponse<Holiday[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: allHolidays, error } = await supabase
      .schema('education')
      .from('holidays')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: allHolidays as Holiday[],
      message: 'Toutes les vacances récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_HOLIDAYS]', error)
    throw new Error('Erreur lors de la récupération des vacances')
  }
}

export async function createDefaultHolidayConfig(userId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const academicYear = new Date().getFullYear().toString()
    const defaultConfig = createDefaultHolidays(academicYear, userId)

    // Sauvegarder la config par défaut dans la base
    const { data: savedConfig, error } = await supabase
      .schema('education')
      .from('holidays')
      .insert({
        academic_year: academicYear,
        holidays_data: defaultConfig.holidays,
        is_active: true,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la création: ${error.message}`)
    }

    return {
      success: true,
      data: savedConfig,
      message: 'Configuration par défaut créée avec succès',
    }
  } catch (error) {
    console.error('[CREATE_DEFAULT_HOLIDAY_CONFIG]', error)
    throw new Error('Erreur lors de la création de la configuration par défaut')
  }
}

// Fonction legacy pour compatibilité - utilise maintenant getAllHolidays
export async function getCurrentHolidays(userId: string): Promise<ApiResponse> {
  try {
    const allHolidaysResponse = await getAllHolidays()

    if (!allHolidaysResponse.success || !allHolidaysResponse.data) {
      // Si pas de vacances, créer une config par défaut
      return await createDefaultHolidayConfig(userId)
    }

    // Trouver la config active
    const activeConfig = allHolidaysResponse.data.find((holiday) => holiday.is_active)

    if (activeConfig) {
      return {
        success: true,
        data: activeConfig,
        message: 'Configuration active récupérée avec succès',
      }
    }

    // Si pas de config active, créer une par défaut
    return await createDefaultHolidayConfig(userId)
  } catch (error) {
    console.error('[GET_CURRENT_HOLIDAYS]', error)
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
