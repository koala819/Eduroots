'use client'
import { differenceInYears } from 'date-fns'
import {
  BookOpen,
  ClipboardList,
  GraduationCap,
  Users,
} from 'lucide-react'
import { useEffect, useMemo,useState } from 'react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { AttendanceProgressBar } from '@/client/components/atoms/SettingsAttendanceProgressBar'
import { AttendanceRateProgress } from '@/client/components/atoms/SettingsAttendanceRateProgress'
import { BehaviorStarRating } from '@/client/components/atoms/SettingsBehaviorStarRating'
import { GradeProgressBar } from '@/client/components/atoms/SettingsGradeProgressBar'
import { EmptyContent, LoadingContent } from '@/client/components/atoms/StatusContent'
import { StudentProfileDialog } from '@/client/components/organisms/SettingsStudentProfileDialog'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import { useStats } from '@/client/context/stats'
import { StudentStats } from '@/types/stats'
import { TeacherWithStudentsResponse } from '@/types/teacher-payload'

type TeacherStudent = TeacherWithStudentsResponse['courses'][0]['sessions'][0]['students'][0]

interface StudentWithDetails extends TeacherStudent {
  stats: StudentStats
}

interface SettingsClassroomProps {
  initialData: TeacherWithStudentsResponse
}

const SettingsClassroom = ({ initialData }: SettingsClassroomProps) => {

  const [studentsWithData, setStudentsWithData] = useState<StudentWithDetails[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const { getStudentAttendance, getStudentBehavior, getStudentGrade } = useStats()
  const sortedStudents = [...studentsWithData]
    .sort((a, b) => a.firstname.localeCompare(b.firstname))

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

  // Récupérer les informations de la classe à partir de la session sélectionnée
  const classInfo = useMemo(() => {
    if (!selectedSession) return {}

    // Trouver la session sélectionnée
    const selectedSessionData = initialData.courses.flatMap((course) =>
      course.sessions.find((session) => session.sessionId === selectedSession),
    ).find(Boolean)

    if (!selectedSessionData) return {}

    return {
      level: selectedSessionData.level,
      subject: selectedSessionData.subject,
      academicYear: initialData.courses.find((course) =>
        course.sessions.some((session) => session.sessionId === selectedSession),
      )?.academicYear || 'N/A',
    }
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
              absencesRate: attendanceData?.data?.attendanceRate ?? 0,
              absencesCount: attendanceData?.data?.totalAbsences ?? 0,
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

  // Calcul de la moyenne générale de la classe
  const classAverage = useMemo(() => {
    const studentsWithGrades = studentsWithData
      .filter((s) => s.stats?.grades?.overallAverage !== undefined)
    if (studentsWithGrades.length === 0) return null

    const total = studentsWithGrades.reduce((sum, student) => {
      return sum + (student.stats.grades.overallAverage || 0)
    }, 0)

    return total / studentsWithGrades.length
  }, [studentsWithData])

  function calculateAge(dateOfBirth: Date | null) {
    if (!dateOfBirth) return 0
    const currentDate = new Date()
    return differenceInYears(currentDate, dateOfBirth)
  }

  if (!initialData.courses || initialData.courses.length === 0) {
    return <EmptyContent />
  }

  if (isLoading) {
    return <LoadingContent />
  }

  return (
    <div className="p-4" data-dashboard="classroom">
      <div className="w-full space-y-6">
        {/* En-tête avec statistiques globales */}
        <div className="bg-background border border-border rounded-lg p-6">
          <h2
            className="text-2xl font-semibold text-foreground mb-6">
            Vue d'ensemble de la classe
          </h2>

          {/* Informations de la classe */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-primary/5
            border border-primary/20">
              <Users className="h-5 w-5 text-primary" />
              <div>
                <div className="text-lg font-semibold text-primary">{sortedStudents.length}</div>
                <div className="text-sm text-muted-foreground">Étudiants</div>
              </div>
            </div>

            {classInfo?.level && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-info/5
              border border-info/20">
                <BookOpen className="h-5 w-5 text-info" />
                <div>
                  <div className="text-lg font-semibold text-info">{classInfo.level}</div>
                  <div className="text-sm text-muted-foreground">Niveau</div>
                </div>
              </div>
            )}

            {classInfo?.subject && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-accent/5
              border border-accent/20">
                <GraduationCap className="h-5 w-5 text-accent" />
                <div>
                  <div className="text-lg font-semibold text-accent">{classInfo.subject}</div>
                  <div className="text-sm text-muted-foreground">Matière</div>
                </div>
              </div>
            )}

            {classAverage !== null && (
              <div className="flex items-center gap-3 p-3 rounded-lg bg-warning/5
              border border-warning/20">
                <ClipboardList className="h-5 w-5 text-warning" />
                <div>
                  <div
                    className="text-lg font-semibold text-warning">{classAverage.toFixed(1)}</div>
                  <div className="text-sm text-muted-foreground">Moyenne classe</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Grille des cartes d'étudiants */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4
        xl:grid-cols-5 gap-6">
          {sortedStudents.map((student, index) => {
            const attendanceRate = 100 - (student.stats?.absencesRate || 0)

            return (
              <Card
                key={student.id}
                className='group transition-all duration-300 hover:shadow-lg hover:scale-105'
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <GenderDisplay gender={student.gender} />
                    <div>
                      <CardTitle
                        className="text-base font-semibold leading-tight text-foreground">
                        {student.firstname} {student.lastname}
                      </CardTitle>
                      <CardDescription className="text-sm text-muted-foreground">
                        {calculateAge(student.dateOfBirth)} ans
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Barre de progression des absences */}
                  <AttendanceProgressBar absencesCount={student.stats?.absencesCount || 0} />

                  {/* Taux de présence */}
                  <AttendanceRateProgress attendanceRate={attendanceRate} />

                  {/* Comportement */}
                  <BehaviorStarRating behaviorAverage={student.stats?.behaviorAverage || 0} />

                  {/* Moyenne générale */}
                  <GradeProgressBar grade={student.stats?.grades?.overallAverage || 0} />
                </CardContent>

                <CardFooter className="flex justify-center">
                  <StudentProfileDialog student={student} />
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default SettingsClassroom
