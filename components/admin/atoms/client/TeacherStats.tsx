'use client'

interface TeacherStats {
  studentCount: number
  courseCount?: number
  attendanceRate: number
  averageStudentSuccess: number
}

interface TeacherStatsClientProps {
  stats: TeacherStats
}

export function TeacherStatsClient({ stats }: TeacherStatsClientProps) {
  return (
    <div className="mt-4 space-y-2">
      <h4 className="font-semibold text-sm text-gray-500">Statistiques</h4>
      <div className="grid grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Nombre de cours</p>
          <p className="text-lg font-semibold">{stats.courseCount}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Nombre d&apos;élèves</p>
          <p className="text-lg font-semibold">{stats.studentCount}</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Taux de présence</p>
          <p className="text-lg font-semibold">{stats.attendanceRate}%</p>
        </div>
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-500">Réussite moyenne</p>
          <p className="text-lg font-semibold">{stats.averageStudentSuccess}%</p>
        </div>
      </div>
    </div>
  )
}
