import { StudentStatsError } from '@/components/admin/atoms/client/StudentAttendanceStatsError'
import { StudentAttendanceStatsClient } from '@/components/admin/molecules/client/StudentAttendanceStats'

import { fetchStudentAttendanceStats } from '@/app/actions/admin/student-stats-attendances'

interface StudentStatsProps {
  studentId: string
}

export async function StudentAttendanceStats({ studentId }: StudentStatsProps) {
  const stats = await fetchStudentAttendanceStats(studentId)

  if (!stats) {
    return <StudentStatsError message="Erreur lors du chargement des statistiques" />
  }

  if (stats.totalSessions === 0) {
    return (
      <StudentStatsError
        variant="warning"
        message="Aucune donnée de présence disponible."
        description={`La période du ${stats.dates[0] || 'N/A'} au ${stats.dates[stats.dates.length - 1] || 'N/A'} ne contient aucun enregistrement.`}
      />
    )
  }

  return <StudentAttendanceStatsClient stats={stats} />
}
