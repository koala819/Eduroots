'use client'

import { useMemo,useState } from 'react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/components/ui/tabs'
import { useToast } from '@/client/hooks/use-toast'
import { DAY_ORDER_ARRAY,formatDayOfWeek } from '@/client/utils/timeSlots'
import { getSubjectColors } from '@/server/utils/helpers'
import {
  CourseWithCompleteTimeRanges,
  CourseWithRelations,
  StudentEnrollment,
  TimeSlot,
  TimeSlotEnum } from '@/types/courses'
import { CourseSessionTimeslot } from '@/types/db'
import { TeacherResponse } from '@/types/teacher-payload'

// Type pour un cours avec session et créneau horaire spécifiques
type CourseWithSessionAndTimeSlot = CourseWithCompleteTimeRanges & {
  currentSession: CourseWithRelations['courses_sessions'][0]
  currentTimeSlot: CourseSessionTimeslot
  uniqueKey: string
}

// Type pour la structure organisée par jour et session
type SessionData = {
  timeSlot: TimeSlot
  courses: CourseWithSessionAndTimeSlot[]
}

interface EditCourseStudentProps {
  allCoursesData: {
    existingCourses: CourseWithCompleteTimeRanges[]
    availableTeachers: TeacherResponse[]
    timeSlotConfigs: Array<{
      id: string
      label: string
      sessions: Array<{ startTime: string; endTime: string }>
    }>
  }
  studentCoursesData: StudentEnrollment[]
  enrollmentData: {
    currentEnrollments: string[]
    initialSelections: Record<string, string>
  }
}

export const EditCourseStudent = ({
  allCoursesData,
  studentCoursesData,
  enrollmentData,
}: EditCourseStudentProps) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('saturday_morning')
  const [selectedSessions, setSelectedSessions] = useState<Record<string, string>>({})

  const currentSessionIds = new Set(enrollmentData.currentEnrollments)

  // Sert à organiser les données des cours pour l'interface utilisateur.
  // Transforme une liste plate de cours en une structure hiérarchique organisée
  const coursesByDayAndSession = useMemo(() => {
    return allCoursesData.existingCourses.reduce((acc, course) => {
      course.courses_sessions.forEach((session) => {
        session.courses_sessions_timeslot?.forEach((timeslot) => {
          const dayOfWeek = timeslot.day_of_week
          if (!acc[dayOfWeek]) {
            acc[dayOfWeek] = {}
          }

          const sessionKey = `${timeslot.start_time}-${timeslot.end_time}`
          if (!acc[dayOfWeek][sessionKey]) {
            acc[dayOfWeek][sessionKey] = {
              timeSlot: {
                day_of_week: timeslot.day_of_week,
                start_time: timeslot.start_time,
                end_time: timeslot.end_time,
                classroom_number: timeslot.classroom_number,
              },
              courses: [],
            }
          }

          acc[dayOfWeek][sessionKey].courses.push({
            ...course,
            currentSession: session,
            currentTimeSlot: timeslot,
            uniqueKey: `${course.id}-${session.id}-${timeslot.start_time}-${timeslot.end_time}`,
          })
        })
      })
      return acc
    }, {} as Record<string, Record<string, SessionData>>)
  }, [allCoursesData.existingCourses])

  // Calculer le nombre total de cours par jour
  const courseCountsByDay = useMemo(() => {
    const counts: Record<string, number> = {}

    Object.entries(coursesByDayAndSession).forEach(([day, daySessions]) => {
      counts[day] = Object.values(daySessions).reduce((total, sessionData) => {
        return total + (sessionData.courses.length / 2)
      }, 0)
    })

    return counts
  }, [coursesByDayAndSession])

  // Fonction utilitaire pour trouver un cours par sessionId
  const findCourseBySessionId = (sessionId: string): CourseWithSessionAndTimeSlot | null => {
    for (const daySessions of Object.values(coursesByDayAndSession)) {
      for (const sessionData of Object.values(daySessions)) {
        const course = sessionData.courses.find((c) => c.currentSession.id === sessionId)
        if (course) return course
      }
    }
    return null
  }

  // Fonction pour soumettre les changements
  const submit = async () => {
    setIsLoading(true)

    try {
      // Calculer les cours à ajouter et à supprimer
      const coursesToAdd: Array<{
        courseId: string
        sessionId: string
        timeSlot: TimeSlot
        subject: string
      }> = []

      const coursesToRemove: Array<{
        courseId: string
        sessionId: string
        subject: string
      }> = []

      // Trouver les cours à ajouter (sélectionnés mais pas inscrits)
      Object.entries(selectedSessions).forEach(([_, sessionId]) => {
        if (!currentSessionIds.has(sessionId)) {
          const foundCourse = findCourseBySessionId(sessionId)
          if (foundCourse) {
            coursesToAdd.push({
              courseId: foundCourse.id,
              sessionId: sessionId,
              timeSlot: {
                day_of_week: foundCourse.currentTimeSlot.day_of_week,
                start_time: foundCourse.currentTimeSlot.start_time,
                end_time: foundCourse.currentTimeSlot.end_time,
                classroom_number: foundCourse.currentTimeSlot.classroom_number,
              },
              subject: foundCourse.currentSession.subject,
            })
          }
        }
      })

      // Trouver les cours à supprimer (inscrits mais pas sélectionnés)
      currentSessionIds.forEach((sessionId) => {
        const isStillSelected = Object.values(selectedSessions).includes(sessionId)
        if (!isStillSelected) {
          const foundCourse = findCourseBySessionId(sessionId)
          if (foundCourse) {
            coursesToRemove.push({
              courseId: foundCourse.id,
              sessionId: sessionId,
              subject: foundCourse.currentSession.subject,
            })
          }
        }
      })

      // Console.log des données
      console.log('=== DONNÉES À AJOUTER ===')
      console.log(coursesToAdd)
      console.log('=== DONNÉES À SUPPRIMER ===')
      console.log(coursesToRemove)

      // TODO: Implémenter la logique d'ajout/suppression
      toast({
        title: 'Changements préparés',
        // eslint-disable-next-line max-len
        description: `${coursesToAdd.length} cours à ajouter, ${coursesToRemove.length} cours à supprimer`,
        variant: 'success',
      })

    } catch (error) {
      console.error('Erreur lors de la modification:', error)
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Une erreur est survenue',
        variant: 'destructive',
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Fonction pour vérifier s'il y a des changements
  const hasChanges = () => {
    // Vérifier si les sélections actuelles sont différentes des inscriptions actuelles
    const currentSelectedSet = new Set(Object.values(selectedSessions))

    // Si le nombre est différent, il y a des changements
    if (currentSelectedSet.size !== currentSessionIds.size) {
      return true
    }

    // Vérifier si tous les cours sélectionnés sont dans les inscriptions actuelles
    for (const sessionId of currentSelectedSet) {
      if (!currentSessionIds.has(sessionId)) {
        return true
      }
    }

    // Vérifier si tous les cours inscrits sont dans les sélections
    for (const sessionId of currentSessionIds) {
      if (!currentSelectedSet.has(sessionId)) {
        return true
      }
    }

    return false
  }

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Récapitulatif des cours actuels */}
      <section className="space-y-4">
        <div className="w-full">
          <h3 className="text-lg font-semibold mb-3">Cours actuels</h3>
          <div className="grid grid-cols-2 gap-2">
            {studentCoursesData.map((enrollment) => {
              const session = enrollment.courses_sessions
              const timeSlot = session.courses_sessions_timeslot?.[0]
              const teacher = session.courses?.courses_teacher?.[0]?.users

              return (
                <div key={session.id} className="bg-white border rounded-lg p-2 text-xs">
                  <span className={`font-medium text-sm ${getSubjectColors(session.subject)}`}>
                    {session.subject}
                  </span>
                  <div className="text-muted-foreground mt-1 space-y-0.5">
                    <div>
                      <p>{teacher?.firstname} {teacher?.lastname}</p>
                      <p>
                        {formatDayOfWeek(timeSlot?.day_of_week as TimeSlotEnum)} •
                        {timeSlot?.start_time?.slice(0, 5)}-{timeSlot?.end_time?.slice(0, 5)}
                      </p>
                    </div>
                    <p>
                      <span>Niv. {session.level}</span>
                      {timeSlot?.classroom_number &&
                        <span>{' '}• Salle {timeSlot.classroom_number}</span>}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl sm:text-3xl font-bold">Cours disponibles pour l&apos;étudiant</h1>
        <p className="text-sm sm:text-base text-gray-600">
          Sélectionnez un cours pour chaque créneau horaire
        </p>
      </div>

      {/* Onglets pour chaque jour */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
          {DAY_ORDER_ARRAY.map((day) => (
            <TabsTrigger
              key={day}
              value={day}
              className="text-xs sm:text-sm py-2 px-1 sm:px-3
              data-[state=inactive]:hover:cursor-pointer">
              <div className="flex flex-col items-center gap-1">
                <span>{formatDayOfWeek(day as TimeSlotEnum)}</span>
                <Badge variant="secondary" className="text-xs">
                  {courseCountsByDay[day] || 0} cours
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {DAY_ORDER_ARRAY.map((day) => (
          <TabsContent key={day} value={day} className="mt-4 sm:mt-6">
            {coursesByDayAndSession[day] && Object.keys(coursesByDayAndSession[day]).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(coursesByDayAndSession[day]).map(([sessionKey, sessionData]) => {
                  const { timeSlot, courses } = sessionData
                  const selectedSessionId = selectedSessions[sessionKey]

                  return (
                    <div key={sessionKey} className="space-y-4">
                      {/* En-tête de la session */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Créneau {timeSlot.start_time.slice(0, 5)}
                              - {timeSlot.end_time.slice(0, 5)}
                            </h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedSessionId && (
                              <Badge variant="default" className="text-sm">
                                1 sélectionné
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grille des cours pour cette session */}
                      <div className="space-y-4">
                        <Select
                          value={selectedSessions[sessionKey] || ''}
                          onValueChange={(value) => setSelectedSessions((prev) => ({
                            ...prev,
                            [sessionKey]: value,
                          }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Choisir un cours">
                              {selectedSessions[sessionKey] && (() => {
                                const selectedCourse = courses
                                  .find((c) => c.currentSession.id === selectedSessions[sessionKey])
                                if (!selectedCourse) return null
                                const teacher = selectedCourse.courses_teacher[0]?.users
                                const teacherName = teacher
                                  ? `${teacher.firstname} ${teacher.lastname}`
                                  : 'Professeur non assigné'
                                return (
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-medium">{teacherName}</span>
                                    <Badge variant="outline" className={`text-xs
                                      ${getSubjectColors(selectedCourse.currentSession.subject)}`}>
                                      {selectedCourse.currentSession.subject}
                                    </Badge>
                                  </div>
                                )
                              })()}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            {courses
                              .sort((a, b) => {
                                const teacherA = a.courses_teacher[0]?.users
                                const teacherB = b.courses_teacher[0]?.users
                                const nameA = teacherA
                                  ? `${teacherA.firstname} ${teacherA.lastname}` : ''
                                const nameB = teacherB
                                  ? `${teacherB.firstname} ${teacherB.lastname}` : ''
                                return nameA.localeCompare(nameB, 'fr')
                              })
                              .map((course) => {
                                const session = course.currentSession
                                const stats = course.stats
                                const teacher = course.courses_teacher[0]?.users
                                const teacherName = teacher
                                  ? `${teacher.firstname} ${teacher.lastname}`
                                  : 'Professeur non assigné'
                                const isCurrentlyEnrolled = currentSessionIds.has(session.id)

                                return (
                                  <SelectItem
                                    key={course.uniqueKey}
                                    value={session.id}
                                    className="py-3"
                                  >
                                    <div className="flex flex-col space-y-2">
                                      <div className="flex items-center justify-between">
                                        <span className="font-medium text-sm">
                                          {teacherName}
                                        </span>
                                        {isCurrentlyEnrolled && (
                                          <Badge variant="secondary" className="text-xs ml-2">
                                            Inscrit
                                          </Badge>
                                        )}
                                      </div>

                                      <div className="flex items-center gap-2 text-xs
                                      text-muted-foreground">
                                        <Badge
                                          variant="outline"
                                          className={`text-xs ${getSubjectColors(session.subject)}`}
                                        >
                                          {session.subject} - Niveau {session.level}
                                        </Badge>
                                      </div>

                                      <div className="flex flex-col gap-1 text-xs">
                                        <span className="text-foreground font-medium">
                                          {stats.totalStudents} étudiants
                                        </span>
                                        <span className="text-foreground">
                                          Age moyen: {stats.averageAge} ans
                                        </span>
                                      </div>

                                      <div className="space-y-1">
                                        <div className="flex items-center gap-3 text-xs">
                                          <div className="flex items-center gap-1">
                                            <GenderDisplay gender="masculin" size="w-3 h-3" />
                                            <span className="text-foreground font-medium">
                                              {stats.countBoys}
                                            </span>
                                          </div>
                                          <div className="flex items-center gap-1">
                                            <GenderDisplay gender="féminin" size="w-3 h-3" />
                                            <span className="text-foreground font-medium">
                                              {stats.countGirls}
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex w-full bg-muted rounded-full
                                        h-2 overflow-hidden">
                                          <div
                                            className="bg-info-dark h-full transition-all
                                            duration-300"
                                            style={{ width: `${stats.percentageBoys}%` }}
                                          ></div>
                                          <div
                                            className="bg-pink h-full transition-all duration-300"
                                            style={{ width: `${stats.percentageGirls}%` }}
                                          ></div>
                                        </div>
                                      </div>
                                    </div>
                                  </SelectItem>
                                )
                              })}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Aucun cours disponible pour ce jour</p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Récapitulatif des sélections et bouton d'action - TOUJOURS VISIBLE */}
      <section className="bg-muted p-6 rounded-lg space-y-4 sticky bottom-0 z-10">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Récapitulatif des sélections</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {Object.keys(selectedSessions).length} sessions sélectionnées
            </span>
          </div>
        </div>

        {/* Liste des cours sélectionnés */}
        {Object.keys(selectedSessions).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(selectedSessions).map(([_, sessionId]) => {
              const foundCourse = findCourseBySessionId(sessionId)

              if (!foundCourse) return null

              const session = foundCourse.currentSession
              const timeSlot = foundCourse.currentTimeSlot
              const isCurrentlyEnrolled = currentSessionIds.has(sessionId)

              return (
                <div key={sessionId} className="bg-background border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {foundCourse.courses_teacher[0]?.users?.firstname}
                        {' '}{foundCourse.courses_teacher[0]?.users?.lastname}
                      </p>
                      <Badge
                        variant="outline"
                        className={`text-xs ${getSubjectColors(session.subject)}`}>
                        {session.subject} - Niveau {session.level}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeSlot.start_time.slice(0, 5)} - {timeSlot.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <Badge
                      variant={isCurrentlyEnrolled ? 'secondary' : 'default'}
                      className="text-xs">
                      {isCurrentlyEnrolled ? 'Déjà inscrit' : 'Nouveau'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Message si aucune sélection */}
        {Object.keys(selectedSessions).length === 0 && (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Aucune session sélectionnée</p>
            <p className="text-xs text-muted-foreground mt-1">
              Sélectionnez un cours pour chaque créneau horaire souhaité
            </p>
          </div>
        )}

        {/* Bouton d'action */}
        <div className="flex justify-end">
          <Button
            onClick={submit}
            disabled={isLoading || !hasChanges()}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent
                rounded-full animate-spin mr-2" />
                Traitement...
              </>
            ) : (
              'Appliquer les changements'
            )}
          </Button>
        </div>
      </section>
    </div>
  )
}
