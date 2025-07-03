import { Suspense } from 'react'

import { StudentBehaviorError } from '@/client/components/admin/atoms/StudentBehaviorError'
import { StudentBehaviorStatsClient } from '@/client/components/admin/atoms/StudentBehaviorStats'
import { fetchStudentBehaviorStats } from '@/server/actions/admin/student-stats-behavior'
import Loading from '@/server/components/admin/atoms/Loading'

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
