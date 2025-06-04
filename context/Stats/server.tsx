'use server'

import { refreshEntityStats, refreshGlobalStats } from '@/app/actions/context/stats'
import { StatsProvider } from '@/context/Stats/client'
import { SerializedValue } from '@/lib/serialization'

// Fallback stats when DB is unavailable
const fallbackGlobalStats = {
  presenceRate: 0,
  totalStudents: 0,
  totalTeachers: 0,
  lastUpdate: new Date(),
}

// Cache en mémoire
let cache = {
  entityStats: null as SerializedValue[] | null,
  globalStats: null as SerializedValue | null,
  lastUpdate: 0,
}

// Cache duration in seconds
const CACHE_DURATION = 60

export default async function StatsServerComponent({ children }: {children: React.ReactNode}) {
  let initialEntityStats: SerializedValue[] = []
  let initialGlobalStats = fallbackGlobalStats as unknown as SerializedValue

  try {
    const now = Date.now()

    // Vérifier si les données sont en cache
    if (cache.lastUpdate && now - cache.lastUpdate < CACHE_DURATION * 1000) {
      // Utiliser les données en cache
      if (cache.entityStats) {
        initialEntityStats = cache.entityStats
      }
      if (cache.globalStats) {
        initialGlobalStats = cache.globalStats
      }
    } else {
      // Mettre à jour les données en parallèle
      const [globalResponse, entityResponse] = await Promise.all([
        refreshGlobalStats(),
        refreshEntityStats(),
      ])

      if (globalResponse.success && globalResponse.data) {
        initialGlobalStats = globalResponse.data as SerializedValue
        cache.globalStats = initialGlobalStats
      }

      if (entityResponse.success && entityResponse.data) {
        initialEntityStats = entityResponse.data as SerializedValue[]
        cache.entityStats = initialEntityStats
      }

      // Mettre à jour le timestamp
      cache.lastUpdate = now
    }
  } catch (error) {
    console.error('Failed to fetch initial stats:', error)
  }

  return (
    <StatsProvider initialEntityStats={initialEntityStats} initialGlobalStats={initialGlobalStats}>
      {children}
    </StatsProvider>
  )
}
