'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect,useMemo } from 'react'

import ChildStats from '@/client/components/molecules/StudentStats'
import { FamilyStudentData } from '@/server/actions/api/family'
import { SubjectNameEnum } from '@/types/courses'
import { User } from '@/types/db'
import { UserRoleEnum } from '@/types/user'
import StudentSelector from '@/zUnused/StudentSelector'

interface FamilyDashboardProps {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
  selectedStudentData: FamilyStudentData | null
  selectedStudentId?: string
}

export function FamilyDashboard({
  familyStudents,
  selectedStudentData,
  selectedStudentId,
}: FamilyDashboardProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleSelectStudent = (studentId: string) => {
    const params = new URLSearchParams(searchParams)
    params.set('student', studentId)
    router.push(`/family?${params.toString()}`)
  }

  // Écouter les changements du header
  useEffect(() => {
    const handleHeaderStudentChange = (event: any) => {
      const { studentId } = event.detail
      handleSelectStudent(studentId)
    }

    window.addEventListener('headerFamilyStudentChanged', handleHeaderStudentChange)

    return () => {
      window.removeEventListener('headerFamilyStudentChanged', handleHeaderStudentChange)
    }
  }, [searchParams]) // Dépendance à searchParams pour avoir la version la plus récente

  const subjectGradesData = useMemo(() => {
    if (!selectedStudentData?.grades?.bySubject) return []

    return Object.entries(selectedStudentData.grades.bySubject).map(([subject, data]) => {
      const average = data?.average ?? 'N/A'
      const grades = data?.grades ?? []

      return {
        subject,
        average,
        grades,
      }
    })
  }, [selectedStudentData?.grades])

  const detailedGrades = useMemo(() => {
    if (!selectedStudentData?.grades) {
      return { overallAverage: 0 }
    }

    const arabeData = selectedStudentData.grades.bySubject?.[SubjectNameEnum.Arabe]
    const educationData = selectedStudentData.grades.bySubject?.[
      SubjectNameEnum.EducationCulturelle
    ]

    return {
      overallAverage: selectedStudentData.grades.overallAverage ?? 0,
      ...(arabeData && {
        [SubjectNameEnum.Arabe]: { average: arabeData.average ?? 0 },
      }),
      ...(educationData && {
        [SubjectNameEnum.EducationCulturelle]: {
          average: educationData.average ?? 0,
        },
      }),
    }
  }, [selectedStudentData?.grades])

  return (
    <>
      <section className="mb-6">
        <h2 className="text-sm font-semibold text-slate-500 mb-3">Choisir un enfant</h2>
        <StudentSelector
          familyStudents={familyStudents}
          selectedChildId={selectedStudentId}
          onSelectStudent={handleSelectStudent}
        />
      </section>

      {selectedStudentData && (
        <ChildStats
          detailedGrades={detailedGrades}
          detailedAttendance={{
            absencesCount: selectedStudentData.attendance?.totalAbsences ?? 0,
            attendanceRate: selectedStudentData.attendance?.attendanceRate ?? 0,
          }}
          detailedCourse={{
            sessions: selectedStudentData.course?.courses_sessions?.map((session) => ({
              ...session,
              timeSlot: session.courses_sessions_timeslot?.[0],
            })) ?? [],
          }}
          detailedTeacher={{
            firstname: selectedStudentData.teacher?.firstname ?? '',
            lastname: selectedStudentData.teacher?.lastname ?? '',
          }}
          subjectGradesData={subjectGradesData}
        />
      )}
    </>
  )
}
