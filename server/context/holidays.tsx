'use server'

import { HolidaysProvider } from '@/client/context/holidays'
import { getCurrentHolidays } from '@/server/actions/api/holidays'
import { Holiday } from '@/types/holidays'

interface HolidaysServerComponentProps {
  children: React.ReactNode
  userId?: string
}

export default async function HolidaysServerComponent({
  children,
  userId,
}: Readonly<HolidaysServerComponentProps>) {
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

  return (
    <HolidaysProvider initialHolidaysData={initialHolidays}>
      {children}
    </HolidaysProvider>
  )
}
