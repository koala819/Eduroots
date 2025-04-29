'use server'

import {DaySchedule} from '@/types/schedule'

import {getCurrentSchedule} from '@/app/actions/context/schedules'
import {SchedulesProvider} from '@/context/Schedules/client'

interface SchedulesServerComponentProps {
  children: React.ReactNode
  userId?: string
}

export default async function SchedulesServerComponent({
  children,
  userId,
}: SchedulesServerComponentProps) {
  let initialSchedules: DaySchedule[] | null = null

  if (userId) {
    const response = await getCurrentSchedule(userId)

    if (response.success && response.data) {
      // Convertir SerializedValue en Holiday[]
      const data = response.data as any

      // Convertir daySchedules en format attendu par le client
      if (data.daySchedules && typeof data.daySchedules === 'object') {
        initialSchedules = Object.entries(data.daySchedules).map(([dayType, scheduleData]) => ({
          dayType,
          periods: (scheduleData as any).periods || [],
        })) as DaySchedule[]
      }
    }
  }

  return <SchedulesProvider initialSchedulesData={initialSchedules}>{children}</SchedulesProvider>
}
