'use client'

import { Book, GraduationCap } from 'lucide-react'

import { GradeCard } from '@/client/components/atoms/StudentGradeCard'
import { InfoCard } from '@/client/components/atoms/StudentInfoCard'
import { StatCard } from '@/client/components/atoms/StudentStatCard'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { LevelEnum } from '@/types/courses'
import { CourseSession, CourseSessionTimeslot } from '@/types/db'
import { StudentStats as StudentStatsType } from '@/types/stats'

interface SubjectGrade {
  subject: string
  average: number | string
  grades: number[]
}

type StudentStatsProps = {
  detailedGrades: StudentStatsType['grades']
  detailedAttendance: {
    absencesCount: number
    attendanceRate: number
  }
  detailedCourse: {
    sessions: (CourseSession & {
      timeSlot: CourseSessionTimeslot
    })[]
  }
  detailedTeacher: {
    firstname: string
    lastname: string
  }
  subjectGradesData: SubjectGrade[]
}

export default function ChildStats({
  detailedGrades,
  detailedAttendance,
  detailedCourse,
  detailedTeacher,
  subjectGradesData,
}: Readonly<StudentStatsProps>) {
  return (
    <>
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <StatCard
          icon="chart"
          color="blue"
          title="Moyenne générale"
          value={detailedGrades?.overallAverage ?? 'N/A'}
          description="/ 20"
        />

        <StatCard
          icon="clock"
          color="purple"
          title="Absences"
          value={detailedAttendance?.absencesCount ?? 'N/A'}
          description={
            detailedAttendance?.absencesCount && detailedAttendance?.absencesCount > 2
              ? 'Journées cette année'
              : 'Journée cette année'
          }
        />

        <StatCard
          icon="star"
          color="gold"
          title="Taux de présence"
          value={
            detailedAttendance?.attendanceRate
              ? `${detailedAttendance.attendanceRate.toFixed(1)}%`
              : 'N/A'
          }
          description="Taux de présence"
        />
      </div>

      {/* Class info */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2">
        <InfoCard
          icon={<Book size={20} />}
          color="slate"
          title="Informations de classe"
          items={[
            {
              label: 'Niveau',
              value: (detailedCourse?.sessions[0].level as LevelEnum) || 'N/A',
            },
            {
              label: 'Enseignant',
              value: detailedTeacher?.lastname.toUpperCase() + ' ' + detailedTeacher?.firstname,
            },
            {
              label: 'Jour de cours',
              value: formatDayOfWeek(
                (detailedCourse?.sessions[0].timeSlot.day_of_week) || 'N/A',
              ),
            },
          ]}
        />
        <GradeCard
          icon={<GraduationCap size={20} />}
          title="Notes par matière"
          subjectGrades={subjectGradesData}
        />
      </div>
    </>
  )
}
