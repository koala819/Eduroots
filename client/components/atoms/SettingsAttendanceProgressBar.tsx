'use client'

import { cn } from '@/server/utils/helpers'

interface AbsenceProgressBarProps {
  absencesCount: number
  maxAbsences?: number
  showLabel?: boolean
  showCount?: boolean
  className?: string
}

export function AttendanceProgressBar({
  absencesCount = 0,
  maxAbsences = 10,
  showLabel = true,
  showCount = true,
  className,
}: AbsenceProgressBarProps) {
  const progressWidth = Math.min((absencesCount / maxAbsences) * 100, 100)

  return (
    <div className={cn('space-y-2', className)}>
      {(showLabel || showCount) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span className="text-xs text-muted-foreground">Absences</span>
          )}
          {showCount && (
            <span className="text-xs font-semibold text-foreground">
              {absencesCount}
            </span>
          )}
        </div>
      )}
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div
          className='h-full rounded-full transition-all duration-300 bg-primary'
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>
    </div>
  )
}
