'use server'

import { statsStudentUpdate } from '@/migrations/stats-student-update'

export async function calculateStats() {
  try {
    const result = await statsStudentUpdate()

    if (result.success) {
      return {
        success: true,
        message: result.message,
      }
    } else {
      throw new Error(result.message)
    }
  } catch (error: any) {
    console.error('[CALCULATE_STATS]', error)
    return {
      success: false,
      message: error.message || 'Erreur interne',
    }
  }
}
