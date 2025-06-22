'use client'

import { Calendar } from 'lucide-react'

import { Holiday } from '@/types/holidays'

interface HolidaysDisplayProps {
  holidays: Holiday[]
}

export const HolidaysDisplay = ({ holidays }: HolidaysDisplayProps) => {
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
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Vacances</h2>
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
