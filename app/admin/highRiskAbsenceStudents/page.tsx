import { Suspense } from 'react'

import {
  HighRiskAbsenceStudents,
} from '@/client/components/admin/molecules/HighRiskAbsenceStudents'
import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { getHighRiskStudents } from '@/server/actions/admin/high-risk-students'

export default async function HighRiskAbsenceStudentsPage() {
  const initialData = await getHighRiskStudents()

  if (initialData.error) {
    return <ErrorContent message={initialData.error} />
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <Suspense fallback={<LoadingContent />}>
        <HighRiskAbsenceStudents initialData={initialData} />
      </Suspense>
    </div>
  )
}
