'use server'

import { StatsProvider } from '@/client/context/stats'
import { refreshEntityStats, refreshGlobalStats } from '@/server/actions/api/stats'
import { GlobalStats } from '@/types/stats'
import { EntityStats } from '@/types/stats-payload'



// Cache en mémoire
let cache = {
  entityStats: null as EntityStats[] | null,
  globalStats: null as GlobalStats | null,
  lastUpdate: 0,
}

// Cache duration in seconds
const CACHE_DURATION = 60

export default async function StatsServerComponent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Fallback stats when DB is unavailable
  let initialGlobalStats = {
    presenceRate: 0,
    totalStudents: 0,
    totalTeachers: 0,
    lastUpdate: new Date(),
  }
  let initialEntityStats: EntityStats[] = []

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
        initialGlobalStats = globalResponse.data
        cache.globalStats = globalResponse.data as GlobalStats
      }

      if (entityResponse.success && entityResponse.data) {
        initialEntityStats = entityResponse.data
        cache.entityStats = entityResponse.data as EntityStats[]
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
