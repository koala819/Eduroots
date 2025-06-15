'use client'

import { AlertCircle } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'

interface StudentStatsErrorProps {
  message: string
  description?: string
  variant?: 'error' | 'warning'
}

export function StudentStatsError({
  message,
  description,
  variant = 'error',
}: StudentStatsErrorProps) {
  const bgColor = variant === 'error' ? 'bg-red-50' : 'bg-yellow-50'
  const borderColor = variant === 'error' ? 'border-red-200' : 'border-yellow-200'
  const textColor = variant === 'error' ? 'text-red-700' : 'text-gray-600'
  const iconColor = variant === 'error' ? 'text-red-500' : 'text-yellow-500'

  return (
    <Card className={`w-full ${borderColor} ${bgColor}`}>
      <CardContent className="p-6">
        <div className="flex flex-col gap-2">
          {variant === 'error' ? (
            <div className="flex items-center gap-4">
              <AlertCircle className={`h-6 w-6 ${iconColor}`} />
              <p className={textColor}>{message}</p>
            </div>
          ) : (
            <>
              <p className="font-medium">{message}</p>
              {description && <p className="text-sm text-gray-600">{description}</p>}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
