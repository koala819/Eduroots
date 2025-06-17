import { Suspense } from 'react'
import { GradesClient } from '@/client/components/pages/TeacherGrades'

export default function GradesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1" />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping mr-1"
            style={{ animationDelay: '0.2s' }}
          />
          <div
            className="w-2 h-2 bg-gray-500 rounded-full animate-ping"
            style={{ animationDelay: '0.4s' }}
          />
        </div>
      }
    >
      <GradesClient />
    </Suspense>
  )
}
