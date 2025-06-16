import { Suspense } from 'react'

import { fetchStudentBehaviorStats } from '@/server/actions/admin/student-stats-behavior'
import { StudentBehaviorStatsClient } from '@/client/components/admin/atoms/StudentBehaviorStats'
import Loading from '@/server/components/admin/atoms/Loading'
import { StudentBehaviorError } from '@/client/components/admin/atoms/StudentBehaviorError'

export async function StudentBehaviorStats({
  studentId,
}: Readonly<{ studentId: string }>) {
  const stats = await fetchStudentBehaviorStats(studentId)

  if (!stats) {
    return (
      <StudentBehaviorError
        message="Aucune donnée de comportement disponible pour cet étudiant."
        variant="info"
      />
    )
  }

  return (
    <Suspense fallback={<Loading name="statistiques des comportements" />}>
      <StudentBehaviorStatsClient stats={stats} />
    </Suspense>
  )
}
