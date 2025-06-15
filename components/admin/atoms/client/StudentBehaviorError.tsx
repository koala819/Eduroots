'use client'

import { Card, CardContent } from '@/components/ui/card'

interface StudentBehaviorErrorProps {
  message: string
  variant?: 'error' | 'warning' | 'info'
}

export function StudentBehaviorError({ message, variant = 'error' }: StudentBehaviorErrorProps) {
  const styles = {
    error: {
      bg: 'bg-red-50',
      text: 'text-red-600',
    },
    warning: {
      bg: 'bg-yellow-50',
      text: 'text-yellow-600',
    },
    info: {
      bg: 'bg-slate-50',
      text: 'text-slate-600',
    },
  }

  const currentStyle = styles[variant]

  return (
    <Card className={`w-full ${currentStyle.bg}`}>
      <CardContent className="p-4">
        <div className={`${currentStyle.text}`}>{message}</div>
      </CardContent>
    </Card>
  )
}
