import React from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'

import { cn } from '@/utils/helpers'

interface Holiday {
  name: string
  start: string | Date
  end: string | Date
  type: 'REGULAR' | 'SPECIAL'
}

interface HolidaysCardProps {
  holidays: Holiday[]
  isLoading?: boolean
}

export const HolidaysCard = ({ holidays, isLoading }: HolidaysCardProps) => {
  return (
    <Card className="bg-white shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold flex items-center justify-between">
          <span>Vacances</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-sm text-gray-500 text-center py-2">Chargement...</div>
          ) : (
            holidays.map((holiday, idx) => (
              <div
                key={idx}
                className={cn(
                  'p-2 rounded-lg text-sm',
                  holiday.type === 'REGULAR'
                    ? 'bg-blue-50 border border-blue-100'
                    : 'bg-amber-50 border border-amber-100',
                )}
              >
                <div className="font-medium">{holiday.name}</div>
                <div className="text-gray-600 text-xs">
                  Du {new Date(holiday.start).toLocaleDateString('fr-FR')} au{' '}
                  {new Date(holiday.end).toLocaleDateString('fr-FR')}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  )
}
