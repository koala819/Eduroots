import { Card, CardContent } from '@/client/components/ui/card'
import { StudentStats } from '@/types/stats'
import { StudentResponse } from '@/types/student-payload'

import { ActivityInfo } from './ActivityInfo'
import { StatsGrid } from './StatsGrid'
import { StudentDetailsDialog } from './StudentDetailsDialog'
import { StudentHeader } from './StudentHeader'

interface StudentAbsenceCardProps {
  student: StudentResponse
  stats: StudentStats
}

export const StudentAbsenceCard = ({ student, stats }: Readonly<StudentAbsenceCardProps>) => {
  return (
    <Card className="w-full overflow-hidden shadow-md hover:shadow-lg
    transition-shadow duration-300 border-none bg-white dark:bg-gray-800
    rounded-lg">
      <StudentHeader student={student} />
      <CardContent className="p-0">
        <StatsGrid stats={stats} />
        <ActivityInfo stats={stats} />
      </CardContent>
      <StudentDetailsDialog student={student} stats={stats} />
    </Card>
  )
}
