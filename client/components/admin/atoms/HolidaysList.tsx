'use client'

import { Calendar } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/client/components/ui/button'
import { useAuth } from '@/client/hooks/use-auth'
import { Holiday } from '@/types/holidays'
import { UserRoleEnum } from '@/types/user'

interface HolidaysListProps {
  holidays: Holiday[]
}

export const HolidaysList = ({ holidays }: HolidaysListProps) => {
  const router = useRouter()
  const { session } = useAuth()

  // Vérifier si l'utilisateur a les droits de modification (admin ou bureau)
  const canModifyHolidays = session?.user?.user_metadata?.role === UserRoleEnum.Admin ||
                            session?.user?.user_metadata?.role === UserRoleEnum.Bureau

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    })
  }

  const sortedHolidays = [...holidays].sort((a, b) => {
    return a.start_date.getTime() - b.start_date.getTime()
  })

  if (sortedHolidays.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucune vacance programmée
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4 justify-between">
        <aside className='flex space-x-2 items-center'>
          <Calendar className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Vacances</h2>
        </aside>
        {/* Bouton Modifier - visible uniquement pour admin/bureau */}
        {canModifyHolidays && (
          <Button
            onClick={() => router.push('/admin/holidays')}
          >
            Modifier
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {sortedHolidays.map((holiday) => {
          const isSingleDay = holiday.start_date.getTime() === holiday.end_date.getTime()
          const dates = isSingleDay
            ? formatDate(holiday.start_date)
            : `${formatDate(holiday.start_date)} - ${formatDate(holiday.end_date)}`

          return (
            <div key={holiday.id} className="card hover:shadow-md transition-all duration-200">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                <div className="flex-1">
                  <h3 className="font-medium text-foreground text-sm">
                    {holiday.name}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {holiday.academic_year}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm text-muted-foreground font-mono">
                    {dates}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
