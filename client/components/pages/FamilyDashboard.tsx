'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'

import { ErrorContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { FamilyFeesSummary } from '@/client/components/molecules/FamilyFeesSummary'
import { ChildStats } from '@/client/components/molecules/FamilyStats'
import { getFamilyFeesForUser } from '@/server/actions/api/fees'
import { getStudentDetailedData } from '@/server/actions/api/family'
import { FamilyStudentData } from '@/server/actions/api/family'
import { SubjectNameEnum } from '@/types/courses'
import { FeeWithPayments } from '@/types/fees-payload'
import { UserRoleEnum } from '@/types/user'

export function FamilyDashboard() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [selectedStudentData, setSelectedStudentData] = useState<FamilyStudentData | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [familyStudents, setFamilyStudents] = useState<any[]>([])

  const selectedStudentId = searchParams.get('student')

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
  }, [searchParams])

  // Récupérer la liste des enfants depuis le header
  useEffect(() => {
    const getFamilyStudentsFromHeader = () => {
      // Chercher l'élément du header qui contient les enfants
      const headerElement = document.querySelector('[data-family-students]')
      if (headerElement) {
        const studentsData = headerElement.getAttribute('data-family-students')
        if (studentsData) {
          try {
            const students = JSON.parse(studentsData)
            setFamilyStudents(students)

            // Si aucun enfant n'est sélectionné et qu'il y a des enfants, sélectionner le premier
            if (!selectedStudentId && students.length > 0) {
              handleSelectStudent(students[0].id)
            }
          } catch (error) {
            console.error('Erreur lors du parsing des données des enfants:', error)
          }
        }
      }
    }

    // Essayer de récupérer les données immédiatement
    getFamilyStudentsFromHeader()

    // Observer les changements du DOM pour récupérer les données quand elles sont disponibles
    const observer = new MutationObserver(() => {
      getFamilyStudentsFromHeader()
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    return () => observer.disconnect()
  }, [selectedStudentId])

  // Charger les données de l'étudiant sélectionné
  useEffect(() => {
    const loadStudentData = async () => {
      if (!selectedStudentId) {
        setSelectedStudentData(null)
        return
      }

      setIsLoading(true)
      try {
        // Créer un objet étudiant minimal avec l'ID
        const student = {
          id: selectedStudentId,
          role: UserRoleEnum.Student,
        } as any

        // Récupérer directement les données détaillées de l'étudiant
        const studentData = await getStudentDetailedData(student)
        setSelectedStudentData(studentData)
      } catch (error) {
        console.error('Erreur lors du chargement des données:', error)
        setSelectedStudentData(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentData()
  }, [selectedStudentId])

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

  // Si aucun enfant n'est disponible
  if (familyStudents.length === 0) {
    return <ErrorContent message="Aucun enfant trouvé dans votre famille" />
  }

  // Si aucun enfant n'est sélectionné mais qu'il y en a, afficher le loading
  if (!selectedStudentId && familyStudents.length > 0) {
    return <LoadingContent />
  }

  if (isLoading || !selectedStudentData) {
    return <LoadingContent />
  }

  return (
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
  )
}
