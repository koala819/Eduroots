'use client'

import { CircleArrowLeft } from 'lucide-react'
import { useRouter } from 'next/navigation'

import { Button } from '@/client/components/ui/button'

interface GradesHeaderProps {
  totalGrades: number
}

export const GradesHeader = ({ totalGrades }: GradesHeaderProps) => {
  const router = useRouter()

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center justify-between">
        <Button
          variant="link"
          className="p-0 text-gray-500 hover:text-blue-600 -ml-1.5 transition-colors"
          onClick={() => router.push('/teacher/settings')}
        >
          <CircleArrowLeft className="mr-2 h-4 w-4" />
          <span className="text-sm font-medium">Retour</span>
        </Button>

        <div className="flex items-center gap-2">
          <div className="h-8 w-8 flex items-center justify-center rounded-full bg-blue-100
           text-blue-600">
            <span className="text-xs font-medium">{totalGrades}</span>
          </div>
          <span className="text-sm text-gray-500">Évaluations</span>
        </div>
      </div>

      <div className="pb-3 border-b border-gray-200">
        <h1 className="text-2xl font-bold text-gray-900">Évaluations</h1>
      </div>
    </div>
  )
}
