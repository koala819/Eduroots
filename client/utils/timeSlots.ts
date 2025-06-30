import { TimeSlotEnum } from '@/types/courses'

// Ordre des créneaux horaires pour le tri et l'affichage
export const DAY_ORDER = {
  [TimeSlotEnum.SATURDAY_MORNING]: 1,
  [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
  [TimeSlotEnum.SUNDAY_MORNING]: 3,
} as const

// Tableau ordonné des créneaux pour l'itération
export const DAY_ORDER_ARRAY = [
  TimeSlotEnum.SATURDAY_MORNING,
  TimeSlotEnum.SATURDAY_AFTERNOON,
  TimeSlotEnum.SUNDAY_MORNING,
] as const

export function formatDayOfWeek(dayOfWeek: TimeSlotEnum): string {
  const dayNames = {
    [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi matin',
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi après-midi',
    [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche matin',
  }
  return dayNames[dayOfWeek] || dayOfWeek
}

export const sortTimeSlots = (a: any, b: any) => {
  const dayA = DAY_ORDER[a.dayOfWeek as TimeSlotEnum] || 999
  const dayB = DAY_ORDER[b.dayOfWeek as TimeSlotEnum] || 999

  if (dayA !== dayB) {
    return dayA - dayB
  }

  // Utiliser directement les valeurs de TimeEnum pour le tri
  // Les valeurs sont déjà dans l'ordre chronologique
  const startTimeA = a.startTime || ''
  const startTimeB = b.startTime || ''

  return startTimeA.localeCompare(startTimeB)
}
