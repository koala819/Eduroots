'use client'


import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { TeacherResponse } from '@/types/teacher-payload'
import { GenderEnum } from '@/types/user'

interface TeacherStats {
  totalStudents: number
  genderDistribution: {
    counts: {
      [GenderEnum.Masculin]: number
      [GenderEnum.Feminin]: number
      undefined: number
    }
    percentages: {
      [GenderEnum.Masculin]: string
      [GenderEnum.Feminin]: string
      undefined: string
    }
  }
  minAge: number
  maxAge: number
  averageAge: number
}

export const TeacherOption = ({
  teacher,
}: {
  teacher: Omit<TeacherResponse, 'stats'> & {stats: TeacherStats}
}) => {
  return (
    <div className="flex flex-col space-y-1">
      <div className="font-medium">
        {teacher.firstname} {teacher.lastname}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-1 text-xs">
        <div className="flex items-center gap-1">
          <span>{teacher.stats.totalStudents} élèves</span>
          <div className="flex space-x-2 items-center">
            <span>(</span>
            <span>{teacher.stats.genderDistribution.percentages[GenderEnum.Feminin]}</span>
            <GenderDisplay gender={GenderEnum.Feminin} />
            <span>/</span>
            <span>{teacher.stats.genderDistribution.percentages[GenderEnum.Masculin]}</span>
            <GenderDisplay gender={GenderEnum.Masculin} />
            <span>)</span>
          </div>
        </div>
        {teacher.stats.averageAge > 0 && (
          <div>Âge moyen : {teacher.stats.averageAge.toFixed(1)} ans</div>
        )}
      </div>
    </div>
  )
}
