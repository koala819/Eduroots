import { compareDesc } from 'date-fns'
import { CalendarDays } from 'lucide-react'

import { TabsContent } from '@/client/components/ui/tabs'
import { StudentStats } from '@/types/stats'

import { formatFullAbsenceDate } from './utils'

interface AbsenceListProps {
  stats: StudentStats
}

export const AbsenceList = ({ stats }: Readonly<AbsenceListProps>) => {
  return (
    <TabsContent value="absences" className="mt-0">
      <div className="max-h-80 overflow-y-auto pr-2 space-y-px">
        {stats.absences.length > 0 ? (
          [...stats.absences]
            .sort((a, b) => compareDesc(a.date, b.date))
            .map((absence) => (
              <div
                key={`${absence.date.toISOString()}-${absence.course}`}
                className="flex justify-between items-center
                p-3 rounded-lg bg-gray-50 mb-2 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center">
                  <CalendarDays className="h-4 w-4 mr-3 text-primary" />
                  <span>
                    {formatFullAbsenceDate(absence.date)}
                  </span>
                </div>
              </div>
            ))
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
