'use client'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { useState } from 'react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { Button } from '@/client/components/ui/button'
import { ScheduleDay } from '@/types/schedule'

export function ScheduleDayCaroussel({ planningDays }: { planningDays: ScheduleDay[] }) {
  const [current, setCurrent] = useState(0)
  const day = planningDays[current]

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrent((prev) => (prev > 0 ? prev - 1 : planningDays.length - 1))}
          className="h-10 w-10 rounded-full border-border hover:bg-accent transition-colors"
          aria-label="Jour précédent"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-bold">{day.dayLabel}</h2>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrent((prev) => (prev < planningDays.length - 1 ? prev + 1 : 0))}
          className="h-10 w-10 rounded-full border-border hover:bg-accent transition-colors"
          aria-label="Jour suivant"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      <div className={`grid grid-cols-${day.slots.length} gap-4`}>
        {day.slots.map(({ slot, cards }) => (
          <div key={slot}>
            <div className="font-semibold text-center mb-2">{slot}</div>
            <div className="space-y-2">
              {cards.map((card) => (
                <Link
                  key={card.sessionId}
                  href={`/admin/members/teacher/edit/${card.teacherId}`}
                  className={`block p-2 rounded shadow-sm text-center hover:bg-primary/80
                     transition ${card.bgColor}`}
                >
                  <div className="font-bold text-base mb-1">{card.teacherName}</div>
                  <div className="text-sm font-semibold mb-1">Niveau {card.level}</div>
                  <div className="text-md font-medium mb-1">{card.subject}</div>
                  <div className="flex flex-col justify-center gap-4 text-xs mt-1
                   bg-warning rounded-md p-2">
                    <div className="text-xs">
                      {card.stats.total} élève{card.stats.total > 1 ? 's' : ''}
                      {card.averageAge > 0 && (
                        <span> · Âge moyen : {card.averageAge} ans</span>
                      )}
                    </div>
                    <div className="flex justify-center gap-4">
                      <span className="flex items-center gap-1">
                        <GenderDisplay gender="masculin" size="w-8 h-8" />
                        {card.stats.male} ({card.stats.malePercentage}%)
                      </span>
                      <span className="flex items-center gap-1">
                        <GenderDisplay gender="féminin" size="w-8 h-8" />
                        {card.stats.female} ({card.stats.femalePercentage}%)
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
