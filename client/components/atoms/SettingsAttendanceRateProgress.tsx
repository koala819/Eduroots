'use client'

import { Progress } from '@/client/components/ui/progress'

interface AttendanceRateProgressProps {
  attendanceRate: number
}

export function AttendanceRateProgress({
  attendanceRate = 0,
}: AttendanceRateProgressProps) {

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">Taux de présence</span>
        <span className='text-xs font-semibold text-warning-dark'>
          {attendanceRate.toFixed(1)}%
        </span>
      </div>

      <Progress
        value={attendanceRate}
        className="h-2"
      />
    </div>
  )
}
