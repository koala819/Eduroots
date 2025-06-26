import { compareDesc } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { TabsContent } from '@/client/components/ui/tabs'
import { StudentStats } from '@/types/stats'

import { formatFullAbsenceDate } from './utils'

interface AbsenceListProps {
  stats: StudentStats
}

export const AbsenceList = ({ stats }: Readonly<AbsenceListProps>) => {
  // Fonction pour convertir une date en objet Date
  const parseDate = (date: Date | string): Date => {
    if (date instanceof Date) return date
    return new Date(date)
  }

  console.log('🔍 [DEBUG] AbsenceList - stats reçues:', {
    absencesCount: stats.absencesCount,
    absencesLength: stats.absences?.length,
    absences: stats.absences,
  })

  return (
    <TabsContent value="absences" className="mt-0">
      <div className="max-h-80 overflow-y-auto pr-2 space-y-px">
        {stats.absences && stats.absences.length > 0 ? (
          [...stats.absences]
            .sort((a, b) => compareDesc(parseDate(a.date), parseDate(b.date)))
            .map((absence) => {
              const parsedDate = parseDate(absence.date)
              console.log('🔍 [DEBUG] Affichage absence:', {
                originalDate: absence.date,
                parsedDate,
                course: absence.course,
              })
              return (
                <div
                  key={absence.id}
                  className="flex justify-between items-center
                  p-3 rounded-lg bg-gray-50 mb-2 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <CalendarDays className="h-4 w-4 mr-3 text-primary" />
                    <span>
                      {formatFullAbsenceDate(parsedDate)}
                    </span>
                  </div>
                </div>
              )
            })
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <CalendarDays className="mx-auto h-8 w-8 mb-2 text-muted-foreground/40" />
            <p>Aucune absence enregistrée</p>
          </div>
        )}
      </div>
    </TabsContent>
  )
}
