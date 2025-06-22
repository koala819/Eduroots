'use client'

import { Star } from 'lucide-react'


interface BehaviorStarRatingProps {
  behaviorAverage: number
}

export function BehaviorStarRating({
  behaviorAverage = 0,
}: BehaviorStarRatingProps) {

  const roundedAverage = Math.round(behaviorAverage)
  const stars = Array.from({ length: 5 }, (_, i) => i + 1)

  return (
    <div className="space-y-2">

      <section className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Comportement</span>
        <span className="text-xs font-semibold text-warning-dark">
          {roundedAverage}/5
        </span>
      </section>

      <section className="flex items-center gap-1">
        {stars.map((star) => (
          <Star
            key={star}
            className='w-4 h-4 text-star fill-current'
          />
        ))}
      </section>
    </div>
  )
}
