import { TabsContent } from '@/client/components/ui/tabs'
import { StudentStats } from '@/types/stats'

interface AbsenceChartProps {
  stats: StudentStats
}

export const AbsenceChart = ({ stats }: Readonly<AbsenceChartProps>) => {
  // Fonction pour convertir une date en objet Date
  const parseDate = (date: Date | string): Date => {
    if (date instanceof Date) return date
    return new Date(date)
  }

  return (
    <TabsContent value="statistics" className="mt-0">
      <div className="space-y-6">
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-3">Résumé</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-1">Taux d&apos;absence</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">
                  {stats.absencesRate.toFixed(1)}%
                </span>
                <span className="text-xs ml-2 text-muted-foreground">sur 100 jours</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-1">Comportement</p>
              <div className="flex items-baseline">
                <span className="text-2xl font-bold">{stats.behaviorAverage}/5</span>
                <span className="text-xs ml-2 text-muted-foreground">moyenne</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
          <h3 className="text-sm font-medium mb-4">
            Tendance d&apos;absences (6 derniers mois)
          </h3>
          <div className="h-24 flex items-end justify-between px-2">
            {(() => {
              // Calculer les absences par mois sur les 6 derniers mois
              const absencesByMonth = new Array(6).fill(0)
              const today = new Date()

              // Si nous n'avons pas d'absences, montrer un message
              if (!stats.absences || stats.absences.length === 0) {
                return (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-xs text-muted-foreground">
                      Aucune donnée disponible
                    </span>
                  </div>
                )
              }

              // Calculer le premier jour du mois il y a 5 mois
              const sixMonthsAgo = new Date()
              sixMonthsAgo.setMonth(today.getMonth() - 5)
              sixMonthsAgo.setDate(1)
              sixMonthsAgo.setHours(0, 0, 0, 0)

              // Compter les absences par mois
              stats.absences.forEach((absence) => {
                const absenceDate = parseDate(absence.date)
                // Ignorer les absences antérieures à 6 mois
                if (absenceDate < sixMonthsAgo) return

                // Calculer l'index du mois (0 = il y a 5 mois, 5 = mois actuel)
                const monthDiff = (today.getMonth() - absenceDate.getMonth() + 12) % 12

                // Vérifier si cette absence est dans les 6 derniers mois
                if (monthDiff < 6) {
                  // Inverser l'ordre pour afficher chronologiquement
                  const index = 5 - monthDiff
                  absencesByMonth[index]++
                }
              })

              // Trouver la valeur maximale pour normaliser la hauteur des barres
              // Au moins 1 pour éviter division par zéro
              const maxAbsences = Math.max(...absencesByMonth, 1)

              // Générer les étiquettes des mois
              return absencesByMonth.map((count, index) => {
                const date = new Date()
                date.setMonth(date.getMonth() - 5 + index)
                const monthNames = [
                  'Jan',
                  'Fév',
                  'Mar',
                  'Avr',
                  'Mai',
                  'Juin',
                  'Juil',
                  'Aoû',
                  'Sep',
                  'Oct',
                  'Nov',
                  'Déc',
                ]
                const month = monthNames[date.getMonth()]
                const monthKey = date.toISOString().slice(0, 7) // Format: "YYYY-MM"

                // Calculer la hauteur proportionnelle
                const maxHeight = 70
                const minHeight = 4
                const height = count > 0
                  ? Math.max(minHeight, Math.min(maxHeight,
                    (count / maxAbsences) * maxHeight))
                  : 0

                return (
                  <div key={monthKey}
                    className="flex flex-col items-center space-y-1 group">
                    <div className="relative">
                      <div
                        className="bg-primary/80 group-hover:bg-primary
                        transition-colors rounded-t"
                        style={{
                          height: `${height}px`,
                          width: '20px',
                        }}
                      />
                      {count > 0 && (
                        <span
                          className="absolute -top-6 left-1/2
                          transform -translate-x-1/2 text-xs py-0.5
                          font-medium bg-primary text-white px-1.5
                          rounded opacity-0 group-hover:opacity-100 transition-opacity
                        ">
                          {count}
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground">{month}</span>
                  </div>
                )
              })
            })()}
          </div>
        </div>
      </div>
    </TabsContent>
  )
}
