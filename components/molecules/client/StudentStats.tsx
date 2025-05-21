'use client'

import { Book, GraduationCap } from 'lucide-react'
import 'react'

import { TimeSlotEnum } from '@/types/course'

import { GradeCard } from '@/components/atoms/client/StudentGradeCard'
import { InfoCard } from '@/components/atoms/client/StudentInfoCard'
import { StatCard } from '@/components/atoms/client/StudentStatCard'

import { formatDayOfWeek } from '@/lib/utils'

type StudentStatsProps = {
  detailedGrades: any
  detailedAttendance: any
  detailedBehavior: any
  detailedCourse: any
  detailedTeacher: any
  subjectGradesData: any
}

export default function ChildStats({
  detailedGrades,
  detailedAttendance,
  detailedBehavior,
  detailedCourse,
  detailedTeacher,
  subjectGradesData,
}: StudentStatsProps) {
  console.log('detailedTeacher', detailedTeacher)
  console.log('prenom', detailedTeacher[0]?.firstname)
  return (
    <>
      {/* Dashboard stats */}
      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <StatCard
          icon="chart"
          color="blue"
          title="Moyenne générale"
          value={detailedGrades?.overallAverage || 'N/A'}
          description="/ 20"
        />

        <StatCard
          icon="clock"
          color="purple"
          title="Absences"
          value={detailedAttendance?.absencesCount || 'N/A'}
          description={
            detailedAttendance?.absencesCount &&
            detailedAttendance?.absencesCount > 2
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
              value: (detailedCourse?.sessions[0].level as string) || 'N/A',
            },

            {
              label: 'Enseignant',
              value: detailedTeacher
                ? `${detailedTeacher[0]?.lastname?.toUpperCase() || ''} ${detailedTeacher[0]?.firstname || ''}`
                : 'N/A',
            },
            {
              label: 'Jour de cours',
              value: formatDayOfWeek(
                (detailedCourse?.sessions[0].timeSlot
                  .dayOfWeek as TimeSlotEnum) || 'N/A',
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
