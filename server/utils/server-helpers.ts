import { addWeeks, isAfter } from 'date-fns'

import { createClient } from '@/server/utils/supabase'
import { TimeSlotEnum } from '@/types/courses'
import { PeriodTypeEnum } from '@/types/schedule'

export function createDefaultHolidays(academicYear: string, updatedBy: string) {
  const defaultHolidays = {
    academicYear,
    holidays: [
      // Vacances régulières
      {
        name: 'Vacances de la Toussaint',
        start: new Date('2024-10-21'),
        end: new Date('2024-11-03'),
        type: 'REGULAR',
      },
      {
        name: 'Vacances de Noël',
        start: new Date('2024-12-23'),
        end: new Date('2025-01-05'),
        type: 'REGULAR',
      },
      {
        name: 'Vacances d\'Hiver',
        start: new Date('2025-02-17'),
        end: new Date('2025-03-02'),
        type: 'REGULAR',
      },
      {
        name: 'Vacances de Printemps',
        start: new Date('2025-04-14'),
        end: new Date('2025-04-27'),
        type: 'REGULAR',
      },
      {
        name: 'Vacances d\'Été',
        start: new Date('2025-06-30'),
        end: new Date('2025-08-31'),
        type: 'REGULAR',
      },
      // Jours spéciaux
      {
        name: 'Ramadan',
        start: new Date('2025-03-01'),
        end: new Date('2025-03-01'),
        type: 'SPECIAL',
      },
      {
        name: 'Aïd El Fitr',
        start: new Date('2025-03-31'),
        end: new Date('2025-03-31'),
        type: 'SPECIAL',
      },
      {
        name: 'Fête de l\'école',
        start: new Date('2025-06-28'),
        end: new Date('2025-06-29'),
        type: 'SPECIAL',
      },
    ],
    isActive: true,
    updatedBy,
  }

  return defaultHolidays
}

export function createDefaultSchedule(academicYear: string, updatedBy: string) {
  const defaultSchedule = {
    academicYear,
    daySchedules: {
      [TimeSlotEnum.SATURDAY_MORNING]: {
        periods: [
          {
            startTime: '09:00',
            endTime: '10:45',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '10:45',
            endTime: '12:30',
            type: PeriodTypeEnum.CLASS,
            order: 2,
          },
        ],
      },
      [TimeSlotEnum.SATURDAY_AFTERNOON]: {
        periods: [
          {
            startTime: '14:00',
            endTime: '15:45',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '15:45',
            endTime: '17:30',
            type: PeriodTypeEnum.CLASS,
            order: 2,
          },
        ],
      },
      [TimeSlotEnum.SUNDAY_MORNING]: {
        periods: [
          {
            startTime: '09:00',
            endTime: '10:45',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '10:45',
            endTime: '12:30',
            type: PeriodTypeEnum.CLASS,
            order: 2,
          },
        ],
      },
    },
    isActive: true,
    updatedBy,
  }

  return defaultSchedule
}

export function generateDateRanges(startDate: Date, numWeeks: number) {
  const periods = []
  for (let i = 0; i < numWeeks; i++) {
    const start = new Date(startDate)
    start.setDate(start.getDate() + i * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    periods.push({
      start: start,
      end: end,
      label: `${start.toISOString().split('T')[0]} to ${
        end.toISOString().split('T')[0]
      }`,
    })
  }
  return periods
}

export function generateSchoolDayDates(timeSlot: TimeSlotEnum): Date[] {
  const HOLIDAYS = [
    // Toussaint
    {
      start: new Date('2023-10-21'),
      end: new Date('2023-11-05'),
    },
    // Noël
    {
      start: new Date('2023-12-23'),
      end: new Date('2024-01-07'),
    },
    // Hiver
    {
      start: new Date('2024-02-17'),
      end: new Date('2024-03-03'),
    },
    // Printemps
    {
      start: new Date('2024-04-13'),
      end: new Date('2024-04-28'),
    },
  ]

  const startYear = process.env.START_YEAR as string
  const dayNumber = timeSlot.startsWith('sunday') ? 0 : 6
  const today = new Date()
  let endDate = new Date(today)

  // Définir la date de début
  const startDate = new Date(startYear)
  while (startDate.getDay() !== dayNumber) {
    startDate.setDate(startDate.getDate() + 1)
  }

  // Trouver la prochaine date valide après les vacances si nécessaire
  for (const holiday of HOLIDAYS) {
    if (today >= holiday.start && today <= holiday.end) {
      endDate = new Date(holiday.end)
      endDate.setDate(endDate.getDate() + 1)
      break
    }
  }

  // Ajuster endDate au prochain jour correct après les vacances
  while (
    endDate.getDay() !== dayNumber ||
    HOLIDAYS.some(
      (holiday) => endDate >= holiday.start && endDate <= holiday.end,
    )
  ) {
    endDate.setDate(endDate.getDate() + 1)
  }

  const dates: Date[] = []
  let currentDate = new Date(startDate)

  while (!isAfter(currentDate, endDate)) {
    const isHoliday = HOLIDAYS.some(
      (holiday) => currentDate >= holiday.start && currentDate <= holiday.end,
    )

    if (!isHoliday) {
      dates.push(new Date(currentDate))
    }
    currentDate = addWeeks(currentDate, 1)
  }

  return dates
}

export async function getSessionServer() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user, supabase }
}
