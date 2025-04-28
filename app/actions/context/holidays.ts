'use server'

import { getServerSession } from 'next-auth'

import { ApiResponse } from '@/types/api'
import { Holiday } from '@/types/holidays'

import { Holidays } from '@/backend/models/holidays.model'
import { SerializedValue, serializeData } from '@/lib/serialization'
import { createDefaultHolidays } from '@/lib/utils'

interface SaveHolidayData {
  updatedBy: string
  holidays: Holiday[]
}

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function getCurrentHolidays(
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // Cherche la config active la plus récente
    const currentConfig = await Holidays.findOne({
      isActive: true,
    }).sort({
      createdAt: -1,
    })

    // Si on trouve une config, on la renvoie
    if (currentConfig) {
      return {
        success: true,
        data: currentConfig ? serializeData(currentConfig) : null,
        message: 'Vacances récupérées avec succès',
      }
    }

    // Sinon on crée une nouvelle config avec les valeurs par défaut
    const academicYear = new Date().getFullYear().toString()
    const defaultConfig = createDefaultHolidays(academicYear, userId)

    return {
      success: true,
      data: defaultConfig ? serializeData(defaultConfig) : null,
      message: 'Création de la config de vacances avec succès',
    }
  } catch (error) {
    console.error('[GET_HOLIDAYS]', error)
    throw new Error('Erreur lors de la récupération des vacances')
  }
}

export async function saveHolidays(
  holidayData: SaveHolidayData,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const currentYear = new Date().getFullYear().toString()
  const academicYear = `${currentYear}-${parseInt(currentYear) + 1}`

  const payload = {
    academicYear,
    holidays: holidayData.holidays,
    isActive: true,
    updatedBy: holidayData.updatedBy,
  }

  try {
    const { holidays, updatedBy } = payload

    if (!holidays || !updatedBy) {
      return {
        success: false,
        message: 'Données manquantes',
        data: null,
      }
    }

    // Cherche et met à jour la configuration existante ou en crée une nouvelle
    const holidaySchedule = await Holidays.findOneAndUpdate(
      { academicYear, isActive: true },
      {
        holidays,
        updatedBy,
      },
      {
        new: true, // Retourne le document mis à jour
        upsert: true, // Crée un nouveau document si aucun n'est trouvé
        runValidators: true, // Active la validation du schéma pour l'update
      },
    )
    return {
      success: true,
      data: holidaySchedule ? serializeData(holidaySchedule) : null,
      message: 'Configuration des vacances enregistrée avec succès',
    }
  } catch (error) {
    console.error('[SAVE_HOLIDAYS]', error)
    throw new Error('Erreur lors de la sauvegarde des vacances')
  }
}
