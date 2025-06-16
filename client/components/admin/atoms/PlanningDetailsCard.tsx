'use client'

import { CourseSession } from '@/zUnused/types/course'
import { GenderEnum, Student } from '@/zUnused/types/user'

import { StatsCard } from '@/server/components/admin/atoms/PlanningStatCard'

interface SessionDetailsCardProps {
  session: CourseSession
}

export default function PlanningDetailsCard({ session }: SessionDetailsCardProps) {
  const calculateGenderDistribution = (students: Student[]) => {
    const distribution = {
      [GenderEnum.Masculin]: 0,
      [GenderEnum.Feminin]: 0,
    }

    students.forEach((student) => {
      if (student.gender) {
        distribution[student.gender]++
      }
    })

    return distribution
  }

  return (
    <>
      <div className="text-sm text-gray-600 mb-4">Salle {session?.timeSlot.classroom_number}</div>
      <div className="grid grid-cols-2 gap-3">
        <StatsCard label="Élèves" value={session?.students?.length || 0} />
        <StatsCard label="Niveau" value={session?.level || 'N/A'} />
        <StatsCard
          label="Garçons"
          value={
            session?.students
              ? calculateGenderDistribution(session.students)[GenderEnum.Masculin]
              : 0
          }
        />
        <StatsCard
          label="Filles"
          value={
            session?.students
              ? calculateGenderDistribution(session.students)[GenderEnum.Feminin]
              : 0
          }
        />
        <StatsCard label="Moyenne" value={session?.stats.averageGrade?.toFixed(1) ?? 'N/A'} />
        <StatsCard
          label="Assiduité"
          value={`${session?.stats.averageAttendance?.toFixed(1) ?? 'N/A'}%`}
        />
      </div>
    </>
  )
}
