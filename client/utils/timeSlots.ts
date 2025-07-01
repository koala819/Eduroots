import { TIME_SLOT_SCHEDULE,TimeSlotEnum } from '@/types/courses'

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

// Interface pour les options de créneaux horaires
export interface TimeSlotOption {
  value: string
  label: string
  start: string
  end: string
}

// Formatage des jours en version courte
export function formatDayOfWeek(dayOfWeek: TimeSlotEnum): string {
  const dayNames = {
    [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi matin',
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi après-midi',
    [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche matin',
  }
  return dayNames[dayOfWeek] || dayOfWeek
}

// Formatage des jours en version complète (pour les formulaires)
export function formatDayOfWeekFull(dayOfWeek: TimeSlotEnum): string {
  const dayNames = {
    [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi Matin',
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi Après-midi',
    [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche Matin',
  }
  return dayNames[dayOfWeek] || dayOfWeek
}

// Génération des options de créneaux horaires pour un jour donné
export function getTimeSlotOptions(dayOfWeek: TimeSlotEnum): TimeSlotOption[] {
  const schedule = TIME_SLOT_SCHEDULE[dayOfWeek]
  return [
    {
      value: `${schedule.START}-${schedule.PAUSE}`,
      label: `${schedule.START} - ${schedule.PAUSE} (1ère heure)`,
      start: schedule.START,
      end: schedule.PAUSE,
    },
    {
      value: `${schedule.PAUSE}-${schedule.FINISH}`,
      label: `${schedule.PAUSE} - ${schedule.FINISH} (2ème heure)`,
      start: schedule.PAUSE,
      end: schedule.FINISH,
    },
    {
      value: `${schedule.START}-${schedule.FINISH}`,
      label: `${schedule.START} - ${schedule.FINISH} (Double heure)`,
      start: schedule.START,
      end: schedule.FINISH,
    },
  ]
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
