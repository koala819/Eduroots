import { AttendanceStatsClient } from '@/client/components/admin/atoms/AttendanceStats'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { refreshGlobalStats } from '@/server/actions/api/stats'
import { GlobalStats } from '@/types/stats'

async function getGlobalStats(): Promise<GlobalStats> {
  const response = await refreshGlobalStats()

  if (!response.success || !response.data) {
    throw new Error(response.message || 'Erreur lors du chargement des statistiques')
  }

  return response.data as unknown as GlobalStats
}

export const AttendanceStatsDisplay = async () => {
  const globalStats = await getGlobalStats()

  return (
    <div className="space-y-4 sm:space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl">Statistiques globales de présence</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          <AttendanceStatsClient globalStats={globalStats} />
        </CardContent>
      </Card>
    </div>
  )
}
