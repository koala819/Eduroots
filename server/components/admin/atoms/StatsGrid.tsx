import { Activity, AlertTriangle, Star } from 'lucide-react'

import { StudentStats } from '@/types/stats'

interface StatsGridProps {
  stats: StudentStats
}

export const StatsGrid = ({ stats }: Readonly<StatsGridProps>) => {
  return (
    <div className="px-4">
      {/* Statistiques principales */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <AlertTriangle className="h-3 w-3 mr-1 text-red-500" />
            <span>Absences</span>
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-xl font-bold">{stats.absencesCount}</span>
            <span className="text-xs text-muted-foreground">
              ({stats.absencesRate.toFixed(1)}%)
            </span>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
          <div className="flex items-center text-xs text-muted-foreground mb-1">
            <Activity className="h-3 w-3 mr-1 text-blue-500" />
            <span>Comportement</span>
          </div>
          <div className="flex items-center">
            <span className="text-xl font-bold mr-1">{stats.behaviorAverage}</span>
            <div className="flex-1">
              <Star className="h-4 w-4 mr-1 text-star fill-star" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
