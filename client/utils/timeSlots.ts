import { TimeSlotEnum } from '@/types/courses'

export const sortTimeSlots = (a: any, b: any) => {
  const dayOrder = {
    [TimeSlotEnum.SATURDAY_MORNING]: 1,
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 2,
    [TimeSlotEnum.SUNDAY_MORNING]: 3,
  }

  const dayA = dayOrder[a.dayOfWeek as TimeSlotEnum] || 999
  const dayB = dayOrder[b.dayOfWeek as TimeSlotEnum] || 999

  if (dayA !== dayB) {
    return dayA - dayB
  }

  // Utiliser directement les valeurs de TimeEnum pour le tri
  // Les valeurs sont déjà dans l'ordre chronologique
  const startTimeA = a.startTime || ''
  const startTimeB = b.startTime || ''

  return startTimeA.localeCompare(startTimeB)
}
