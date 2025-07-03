'use client'

import { ClipboardList } from 'lucide-react'


interface GradeProgressBarProps {
  grade: number
}

export function GradeProgressBar({
  grade = 0,
}: GradeProgressBarProps) {
  const getGradeColorClass = (grade: number) => {
    if (grade >= 16) return 'text-success'
    if (grade >= 14) return 'text-info'
    if (grade >= 12) return 'text-accent'
    if (grade >= 10) return 'text-warning'
    return 'text-error'
  }

  const getProgressColorClass = (grade: number) => {
    if (grade >= 16) return 'bg-success'
    if (grade >= 14) return 'bg-info'
    if (grade >= 12) return 'bg-accent'
    if (grade >= 10) return 'bg-warning'
    return 'bg-error'
  }

  const progressWidth = (grade / 20) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Moyenne générale</span>
        <span className='text-xs font-semibold text-warning-dark'>
          {grade.toFixed(1)}/20
        </span>
      </div>

      <div className="flex items-center gap-1">

        <ClipboardList className="h-3 w-3 text-muted-foreground" />

        <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className='h-full rounded-full transition-all duration-300 bg-primary'
            style={{
              width: `${progressWidth}%`,
            }}
          />
        </div>
      </div>
    </div>
  )
}
