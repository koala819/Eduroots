'use server'

import {
  refreshEntityStats,
  refreshGlobalStats,
} from '@/app/actions/context/stats'
import { StatsProvider } from '@/context/Stats/client'
import { SerializedValue } from '@/lib/serialization'

// Fallback stats when DB is unavailable
const fallbackGlobalStats = {
  presenceRate: 0,
  totalStudents: 0,
  totalTeachers: 0,
  lastUpdate: new Date(),
}

export default async function StatsServerComponent({
  children,
}: {
  children: React.ReactNode
}) {
  let initialEntityStats: SerializedValue[] = []
  let initialGlobalStats = fallbackGlobalStats as unknown as SerializedValue

  try {
    // Sequential fetching rather than parallel to ensure connection stability
    await refreshGlobalStats()
      .then((response) => {
        if (response.success && response.data) {
          initialGlobalStats = response.data as SerializedValue
        }
      })
      .catch((error) => {
        console.error('Failed to fetch global stats:', error)
      })

    await refreshEntityStats()
      .then((response) => {
        if (response.success && response.data) {
          initialEntityStats = response.data as SerializedValue[]
        }
      })
      .catch((error) => {
        console.error('Failed to fetch entity stats:', error)
      })
  } catch (error) {
    console.error('Failed to fetch initial stats:', error)
  }

  return (
    <StatsProvider
      initialEntityStats={initialEntityStats}
      initialGlobalStats={initialGlobalStats}
    >
      {children}
    </StatsProvider>
  )
}
