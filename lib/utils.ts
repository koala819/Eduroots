import { TimeSlotEnum } from '@/types/course'
import { ButtonVariant, ThemeConfig } from '@/types/models'
import { PeriodTypeEnum } from '@/types/schedule'
import { SerializableDate } from '@/types/stats'

import { type ClassValue, clsx } from 'clsx'
import { addWeeks, isAfter } from 'date-fns'
import { signOut } from 'next-auth/react'
import { twMerge } from 'tailwind-merge'

export function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase()
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// / Fonction utilitaire pour convertir SerializableDate en Date native
export function convertToDate(date: SerializableDate): Date {
  // Si c'est une Date native
  if (date instanceof Date) {
    return date
  }

  // Si c'est un objet avec $date (format MongoDB sérialisé)
  if (typeof date === 'object' && date !== null && '$date' in date) {
    return new Date(date.$date)
  }

  // Si c'est une chaîne de caractères (ISO string)
  if (typeof date === 'string') {
    return new Date(date)
  }

  // Si c'est un nombre (timestamp)
  if (typeof date === 'number') {
    return new Date(date)
  }

  // Cas improbable mais pour une sécurité totale
  console.warn('Format de date inconnu:', date)
  return new Date()
}

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
            endTime: '10:30',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '10:30',
            endTime: '10:45',
            type: PeriodTypeEnum.BREAK,
            order: 2,
          },
          {
            startTime: '10:45',
            endTime: '12:15',
            type: PeriodTypeEnum.CLASS,
            order: 3,
          },
        ],
      },
      [TimeSlotEnum.SATURDAY_AFTERNOON]: {
        periods: [
          {
            startTime: '14:00',
            endTime: '15:30',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '15:30',
            endTime: '15:45',
            type: PeriodTypeEnum.BREAK,
            order: 2,
          },
          {
            startTime: '15:45',
            endTime: '17:15',
            type: PeriodTypeEnum.CLASS,
            order: 3,
          },
        ],
      },
      [TimeSlotEnum.SUNDAY_MORNING]: {
        periods: [
          {
            startTime: '09:00',
            endTime: '10:30',
            type: PeriodTypeEnum.CLASS,
            order: 1,
          },
          {
            startTime: '10:30',
            endTime: '10:45',
            type: PeriodTypeEnum.BREAK,
            order: 2,
          },
          {
            startTime: '10:45',
            endTime: '12:15',
            type: PeriodTypeEnum.CLASS,
            order: 3,
          },
        ],
      },
    },
    isActive: true,
    updatedBy,
  }

  return defaultSchedule
}

export function formatName(firstname: string, lastname: string) {
  return {
    firstName: firstname.charAt(0).toUpperCase() + firstname.slice(1).toLowerCase(),
    lastName: lastname.toUpperCase(),
  }
}

export function formatDayOfWeek(dayOfWeek: TimeSlotEnum): string {
  const translations = {
    [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi matin',
    [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi après-midi',
    [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche matin',
  }
  return translations[dayOfWeek] || dayOfWeek
}

export function formatAdminConfigTitle(title: string) {
  const prefixes = ['teacher', 'student', 'bureau']
  for (const prefix of prefixes) {
    if (title.toLowerCase().startsWith(prefix)) {
      return title.slice(prefix.length)
    }
  }
  return title
}

export function generateDefaultTheme(role: 'teacher' | 'student' | 'bureau'): ThemeConfig {
  const buttonVariants = {} as Record<ButtonVariant, string>
  ;(['Cancel', 'Default', 'Secondary', 'Tertiary', 'Warning'] as const).forEach((variant) => {
    buttonVariants[`${role}${variant}` as ButtonVariant] = ''
  })

  return {
    buttonVariants,
    cardHeader: '',
    loader: '', // Un loader par défaut générique
  }
}

export function generateWeeklyDates(timeSlot: TimeSlotEnum): Date[] {
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
    HOLIDAYS.some((holiday) => endDate >= holiday.start && endDate <= holiday.end)
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

export function getColorClass(absences: number): string {
  if (absences === 0) {
    return 'bg-effet-metal-or from-or-clair via-or to-or-fonce text-amber-900'
  } // 0 absences
  switch (absences % 3) {
  case 1:
    return 'bg-effet-metal-argent from-argent-clair via-argent to-argent-fonce ' +
           'text-slate-900' // 1, 4, 7... absences
  case 2:
    return 'bg-effet-metal-bronze from-bronze-clair via-bronze to-bronze-fonce ' +
           'text-orange-50' // 2, 5, 8... absences
  case 0:
    return 'bg-effet-inferno from-inferno-light via-inferno to-inferno-dark ' +
           'text-black' // 3, 6, 9... absences
  default:
    return 'bg-gray-500 text-white' // Should never happen, but for safety
  }
}

export function logoutHandler() {
  signOut({
    redirect: true,
    callbackUrl: `${process.env.NEXT_PUBLIC_CLIENT_URL}/`,
  })
}
