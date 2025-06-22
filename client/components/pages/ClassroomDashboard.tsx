'use client'

import { Users } from 'lucide-react'
import { useEffect, useMemo,useState } from 'react'

import { ClassOverview, StudentWithDetails } from '@/client/components/atoms/ClassOverview'
import { EmptyContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { useStats } from '@/client/context/stats'
import { StudentStats } from '@/types/stats'
import { TeacherWithStudentsResponse } from '@/types/teacher-payload'

interface ClassroomDashboardProps {
  initialData: TeacherWithStudentsResponse
}

const ClassroomDashboard = ({ initialData }: ClassroomDashboardProps) => {
  const [studentsWithData, setStudentsWithData] = useState<StudentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { getStudentAttendance, getStudentBehavior, getStudentGrade } = useStats()

  // Initialiser avec le créneau par défaut (pré-calculé côté serveur)
  const [selectedSession, setSelectedSession] = useState<string | null>(
    initialData.defaultSessionId || null,
  )

  const selectedStudents = useMemo(() => {
    if (!selectedSession) return []

    return initialData.courses.flatMap((course) => {
      const filteredSessions = course.sessions.filter(
        (session) => session.sessionId === selectedSession,
      )
      return filteredSessions.flatMap(
        (session) => session.students,
      )
    })
  }, [selectedSession, initialData.courses])

  // Écouter les changements depuis le header
  useEffect(() => {
    const handleHeaderTimeSlotChanged = (event: CustomEvent) => {
      const { sessionId } = event.detail
      setSelectedSession(sessionId)
    }

    window.addEventListener('headerTimeSlotChanged', handleHeaderTimeSlotChanged as any)
    return () => {
      window.removeEventListener('headerTimeSlotChanged', handleHeaderTimeSlotChanged as any)
    }
  }, [])

  // Charger les données des étudiants quand le créneau change
  useEffect(() => {
    const loadStudentData = async () => {
      setIsLoading(true)

      try {
        if (selectedStudents.length > 0) {
          const allApiCalls = selectedStudents.flatMap((student) => [
            getStudentAttendance(student.id),
            getStudentBehavior(student.id),
            getStudentGrade(student.id),
          ])

          const allResults = await Promise.all(allApiCalls)

          const completeStudents: StudentWithDetails[] = []

          for (let i = 0; i < selectedStudents.length; i++) {
            const student = selectedStudents[i]
            const baseIndex = i * 3

            const [attendanceData, behaviorData, gradesData] = [
              allResults[baseIndex],
              allResults[baseIndex + 1],
              allResults[baseIndex + 2],
            ]

            const studentStats: StudentStats = {
              userId: student.id,
              absencesRate: attendanceData?.data?.absencesRate ?? 0,
              absencesCount: attendanceData?.data?.absencesCount ?? 0,
              behaviorAverage: behaviorData?.data?.behaviorAverage ?? 0,
              absences: attendanceData?.data?.absences ?? [],
              grades: gradesData?.data ?? { overallAverage: 0 },
              lastActivity: attendanceData?.data?.lastActivity
                ? new Date(attendanceData.data.lastActivity)
                : null,
              lastUpdate: new Date(),
            }

            completeStudents.push({
              ...student,
              stats: studentStats,
            })
          }

          setStudentsWithData(completeStudents)
        } else {
          setStudentsWithData([])
        }
      } catch (err) {
        console.error('Erreur lors du chargement des données des étudiants:', err)
      } finally {
        setIsLoading(false)
      }
    }

    loadStudentData()
  }, [selectedStudents, getStudentAttendance, getStudentBehavior, getStudentGrade])

  if (!initialData.courses || initialData.courses.length === 0) {
    return <EmptyContent />
  }

  const selectedTimeSlot = useMemo(() => {
    return initialData.timeSlots?.find((ts) => ts.id === selectedSession)
  }, [initialData.timeSlots, selectedSession])

  const selectedSubject = selectedTimeSlot?.subject || ''

  return (
    <div className="p-4" data-dashboard="classroom">
      <div className="space-y-6 mt-4">
        {isLoading ? (
          <LoadingContent />
        ) : (
          <Card className="bg-white border border-zinc-200 shadow-sm
          hover:shadow-md transition-shadow duration-200">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-800">
                {selectedSubject}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 border-t border-zinc-100">
              <div className="flex items-center gap-2.5 mb-4">
                <Users className="h-4 w-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-600">
                  {selectedStudents.length} étudiants
                </span>
              </div>
              <ClassOverview students={studentsWithData} />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

export default ClassroomDashboard
