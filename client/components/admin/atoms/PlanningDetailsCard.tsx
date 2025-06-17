'use client'

import { CourseSessionWithRelations } from '@/types/courses'
import { GenderEnum } from '@/types/user'

import { StatsCard } from '@/server/components/admin/atoms/PlanningStatCard'

type ExtendedCourseSession = CourseSessionWithRelations & {
  user?: {
    id: string
    firstname: string
    lastname: string
    role: string
  }
}

interface SessionDetailsCardProps {
  session: ExtendedCourseSession
}

type GenderDistribution = {
  [key in GenderEnum]: number
}

export default function PlanningDetailsCard({ session }: Readonly<SessionDetailsCardProps>) {
  const calculateGenderDistribution = (
    students: CourseSessionWithRelations['courses_sessions_students'],
  ): GenderDistribution => {
    const distribution: GenderDistribution = {
      [GenderEnum.Masculin]: 0,
      [GenderEnum.Feminin]: 0,
    }

    students.forEach((student) => {
      if (student.users.gender) {
        distribution[student.users.gender as GenderEnum]++
      }
    })

    return distribution
  }

  const timeSlot = session.courses_sessions_timeslot[0]

  return (
    <>
      <div className="text-sm text-gray-600 mb-4">Salle {timeSlot?.classroom_number ?? 'N/A'}</div>
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Élèves" value={session.courses_sessions_students?.length ?? 0} />
        <StatsCard label="Niveau" value={session.level ?? 'N/A'} />
        <StatsCard
          label="Garçons"
          value={
            session.courses_sessions_students
              ? calculateGenderDistribution(session.courses_sessions_students)[GenderEnum.Masculin]
              : 0
          }
        />
        <StatsCard
          label="Filles"
          value={
            session.courses_sessions_students
              ? calculateGenderDistribution(session.courses_sessions_students)[GenderEnum.Feminin]
              : 0
          }
        />
        <StatsCard label="Moyenne" value={session.stats_average_grade?.toFixed(1) ?? 'N/A'} />
        <StatsCard
          label="Assiduité"
          value={`${session.stats_average_attendance?.toFixed(1) ?? 'N/A'}%`}
        />
      </div>
    </>
  )
}
