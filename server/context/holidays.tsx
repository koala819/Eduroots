'use server'

import { Holiday } from '@/zUnused/mongo/holidays'

import { getCurrentHolidays } from '@/server/actions/context/holidays'
import { HolidaysProvider } from '@/client/context/holidays'

interface HolidaysServerComponentProps {
  children: React.ReactNode
  userId?: string
}

export default async function HolidaysServerComponent({
  children,
  userId,
}: HolidaysServerComponentProps) {
  let initialHolidays: Holiday[] | null = null

  if (userId) {
    const response = await getCurrentHolidays(userId)

    if (response.success && response.data) {
      // Convertir SerializedValue en Holiday[]
      const data = response.data as any

      if (data.holidays && Array.isArray(data.holidays)) {
        initialHolidays = data.holidays as Holiday[]
      }
    }
  }

  return <HolidaysProvider initialHolidaysData={initialHolidays}>{children}</HolidaysProvider>
}
