import { StudentBehaviorError } from '@/components/admin/atoms/client/StudentBehaviorError'
import { StudentBehaviorStatsClient } from '@/components/admin/atoms/client/StudentBehaviorStats'

import { fetchStudentBehaviorStats } from '@/app/actions/admin/student-stats-behavior'

interface StudentBehaviorStatsProps {
  studentId: string
}

export async function StudentBehaviorStats({
  studentId,
}: StudentBehaviorStatsProps) {
  const stats = await fetchStudentBehaviorStats(studentId)

  if (!stats) {
    return (
      <StudentBehaviorError
        message="Aucune donnée de comportement disponible pour cet étudiant."
        variant="info"
      />
    )
  }

  return <StudentBehaviorStatsClient stats={stats} />
}
