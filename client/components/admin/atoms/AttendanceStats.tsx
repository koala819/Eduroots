'use client'

import { GlobalStats } from '@/types/stats'

import { Progress } from '@/client/components/ui/progress'

import { convertToDate } from '@/server/utils/helpers'

interface AttendanceStatsClientProps {
  globalStats: GlobalStats
}

export const AttendanceStatsClient = ({ globalStats }: AttendanceStatsClientProps) => {
  // Fonction pour déterminer la couleur basée sur le taux de présence
  function getPresenceColor(rate: number) {
    if (rate >= 90) return 'text-green-600'
    if (rate >= 80) return 'text-blue-600'
    if (rate >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  // Convertir la date sérialisée en Date native
  const lastUpdateDate = convertToDate(globalStats.lastUpdate)

  return (
    <>
      {/* Taux de présence */}
      <div>
        <div className="flex justify-between mb-2">
          <span>Taux de présence moyen</span>
          <span className={getPresenceColor(globalStats.presenceRate)}>
            {globalStats.presenceRate.toFixed(1)}%
          </span>
        </div>
        <Progress value={globalStats.presenceRate} className="h-2" />
      </div>

      {/* Moyenne d'étudiants */}
      {/* <div

      className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4"
      > */}
      {/* <div className="border rounded-lg p-3 sm:p-4">
          <div className="text-xs sm:text-sm text-gray-500">
            Moyenne d&apos;étudiants/classe
          </div>
          <div className="text-xl sm:text-2xl font-bold mt-1">
            {Math.round(globalStats.totalStudents)}
          </div>
        </div> */}
      <div className="border rounded-lg p-3 sm:p-4">
        <div className="text-xs sm:text-sm text-gray-500">Dernière mise à jour</div>
        <div className="text-xs sm:text-sm mt-1">
          {lastUpdateDate.toLocaleDateString('fr-FR', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </div>
      </div>
      {/* </div> */}

      {/* Légende */}
      <div className="text-xs sm:text-sm text-gray-500 mt-3 sm:mt-4">
        <p>Ces statistiques sont calculées à partir de toutes les sessions actives.</p>
        <p>
          Le taux de présence représente la moyenne des présences sur l&apos;ensemble des sessions.
        </p>
      </div>
    </>
  )
}
