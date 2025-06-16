import { StudentBehaviorError } from '@/client/components/admin/atoms/StudentBehaviorError'
import { StudentBehaviorStatsClient } from '@/client/components/admin/atoms/StudentBehaviorStats'

import { fetchStudentBehaviorStats } from '@/server/actions/admin/student-stats-behavior'

interface StudentBehaviorStatsProps {
  studentId: string
}

export async function StudentBehaviorStats({
  studentId,
}: Readonly<StudentBehaviorStatsProps>) {
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
