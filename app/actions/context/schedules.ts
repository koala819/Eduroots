'use server'

import { getServerSession } from 'next-auth'

import { ApiResponse } from '@/types/api'

import { ScheduleConfig } from '@/backend/models/schedule-config.model'
import { SerializedValue, serializeData } from '@/lib/serialization'
import { createDefaultSchedule } from '@/lib/utils'

interface SaveScheduleData {
  updatedBy: string
  [key: string]: any // pour les daySchedules
}

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function getCurrentSchedule(
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    // Cherche la config active la plus récente
    const currentConfig = await ScheduleConfig.findOne({ isActive: true }).sort(
      { createdAt: -1 },
    )

    // Si on trouve une config, on la renvoie
    if (currentConfig) {
      return {
        success: true,
        data: currentConfig ? serializeData(currentConfig) : null,
        message: 'Schedule récupéré avec succès',
      }
    }

    const academicYear = new Date().getFullYear().toString()

    //Sinon création du document avec les valeurs par défaut
    const defaultConfig = createDefaultSchedule(academicYear, userId)

    return {
      success: true,
      data: defaultConfig ? serializeData(defaultConfig) : null,
      message: 'Schedule créé avec valeurs par défaut',
    }
  } catch (error) {
    console.error('[GET_CURENT_SCHEDULES]', error)
    throw new Error('Erreur lors de la récupération des schedules')
  }
}

export async function saveSchedules(scheduleData: SaveScheduleData) {
  await getSessionServer()

  const currentYear = new Date().getFullYear().toString()
  const academicYear = `${currentYear}-${parseInt(currentYear) + 1}`

  const payload = {
    academicYear,
    daySchedules: Object.fromEntries(
      Object.entries(scheduleData).filter(([key]) => key !== 'updatedBy'),
    ),

    updatedBy: scheduleData.updatedBy,
  }

  try {
    const { academicYear, daySchedules, updatedBy } = payload

    if (!daySchedules || !updatedBy) {
      return {
        success: false,
        message: 'Données manquantes',
        data: null,
      }
    }

    // Cherche et met à jour la configuration existante ou en crée une nouvelle
    const scheduleConfig = await ScheduleConfig.findOneAndUpdate(
      { academicYear, isActive: true },
      {
        daySchedules,
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
      data: scheduleConfig ? serializeData(scheduleConfig) : null,
      message: 'Configuration des horaires enregistrée avec succès',
    }
  } catch (error) {
    console.error('[SAVE_SCHEDULES]', error)
    throw new Error('Erreur lors de la sauvegarde des schedules')
  }
}
