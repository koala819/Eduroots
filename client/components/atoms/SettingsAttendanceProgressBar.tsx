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
  const getColorClass = (count: number) => {
    if (count === 0) return 'bg-success'
    if (count > 5) return 'bg-error'
    if (count > 2) return 'bg-warning'
    return 'bg-success'
  }
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
          className={cn(
            'h-full rounded-full transition-all duration-300',
            getColorClass(absencesCount),
          )}
          style={{
            width: `${progressWidth}%`,
          }}
        />
      </div>
    </div>
  )
}
