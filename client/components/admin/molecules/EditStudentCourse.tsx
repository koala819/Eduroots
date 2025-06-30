'use client'

import { useState } from 'react'

import { GenderDisplay } from '@/client/components/atoms/GenderDisplay'
import { Badge } from '@/client/components/ui/badge'
import { Button } from '@/client/components/ui/button'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/client/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/client/components/ui/tabs'
import { useToast } from '@/client/hooks/use-toast'
import { formatDayOfWeek, getSubjectColors } from '@/server/utils/helpers'
import { CourseWithRelations, StudentEnrollment, TimeSlotEnum } from '@/types/courses'
import { TeacherResponse } from '@/types/teacher-payload'

// Type étendu pour inclure les plages horaires complètes
type CourseWithCompleteTimeRanges = CourseWithRelations & {
  courses_sessions: (CourseWithRelations['courses_sessions'][0] & {
    completeTimeRange?: {
      min_start_time: string
      max_end_time: string
      day_of_week: string
      subjects: Array<{
        subject: string
        level: string
        start_time: string
        end_time: string
      }>
    } | null
  })[]
  timeRanges?: Array<{
    course_id: string
    academic_year: string
    day_of_week: string
    min_start_time: string
    max_end_time: string
    subjects: Array<{
      subject: string
      level: string
      start_time: string
      end_time: string
    }>
  }>
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
  const [selectedCourses, setSelectedCourses] = useState<Map<string, string>>(
    new Map(Object.entries(enrollmentData.initialSelections)),
  )

  const currentSessionIds = new Set(enrollmentData.currentEnrollments)

  // Organiser les cours par jour et par session (créneau horaire)
  const coursesByDayAndSession = allCoursesData.existingCourses.reduce((acc, course) => {
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
  }, {} as Record<string, Record<string, { timeSlot: any, courses: any[] }>>)

  // Calculer le nombre total de cours par jour
  const getCourseCount = (day: string) => {
    const daySessions = coursesByDayAndSession[day]
    if (!daySessions) return 0

    return Object.values(daySessions).reduce((total, sessionData) => {
      return total + sessionData.courses.length
    }, 0)
  }

  // Fonction pour gérer la sélection d'un cours (1 seul par session)
  const handleCourseSelection = (sessionId: string, sessionKey: string) => {
    setSelectedCourses((prev) => {
      const newMap = new Map(prev)

      // Si ce cours est déjà sélectionné pour cette session, le désélectionner
      if (newMap.get(sessionKey) === sessionId) {
        newMap.delete(sessionKey)
      } else {
        // Sinon, sélectionner ce cours (remplace l'ancien si il y en avait un)
        newMap.set(sessionKey, sessionId)
      }

      return newMap
    })
  }

  // Fonction pour appliquer les changements
  const handleApplyChanges = async () => {
    setIsLoading(true)

    try {
      // Calculer les cours à ajouter et à supprimer
      const coursesToAdd: Array<{
        courseId: string
        sessionId: string
        timeSlot: any
        subject: string
      }> = []

      const coursesToRemove: Array<{
        courseId: string
        sessionId: string
        subject: string
      }> = []

      // Trouver les cours à ajouter (sélectionnés mais pas inscrits)
      selectedCourses.forEach((sessionId, sessionKey) => {
        if (!currentSessionIds.has(sessionId)) {
          // Trouver les données du cours
          let foundCourse: any = null
          Object.values(coursesByDayAndSession).forEach((daySessions) => {
            Object.values(daySessions).forEach((sessionData) => {
              const course = sessionData.courses.find((c: any) => c.currentSession.id === sessionId)
              if (course) foundCourse = course
            })
          })

          if (foundCourse) {
            coursesToAdd.push({
              courseId: foundCourse.id,
              sessionId: sessionId,
              timeSlot: foundCourse.currentTimeSlot,
              subject: foundCourse.currentSession.subject,
            })
          }
        }
      })

      // Trouver les cours à supprimer (inscrits mais pas sélectionnés)
      currentSessionIds.forEach((sessionId) => {
        const isStillSelected = Array.from(selectedCourses.values()).includes(sessionId)
        if (!isStillSelected) {
          // Trouver les données du cours
          let foundCourse: any = null
          Object.values(coursesByDayAndSession).forEach((daySessions) => {
            Object.values(daySessions).forEach((sessionData) => {
              const course = sessionData.courses.find((c: any) => c.currentSession.id === sessionId)
              if (course) foundCourse = course
            })
          })

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

  const formatDayLabel = (day: string) => {
    const dayLabels: Record<string, string> = {
      'saturday_morning': 'Samedi matin',
      'saturday_afternoon': 'Samedi après-midi',
      'sunday_morning': 'Dimanche matin',
    }
    return dayLabels[day] || day
  }

  const getTeacherName = (course: CourseWithCompleteTimeRanges) => {
    const teacher = course.courses_teacher[0]?.users
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : 'Professeur non assigné'
  }

  const dayOrder = ['saturday_morning', 'saturday_afternoon', 'sunday_morning']

  // Fonction pour vérifier s'il y a des changements
  const hasChanges = () => {
    // Vérifier si les sélections actuelles sont différentes des inscriptions actuelles
    const currentSelectedSet = new Set(selectedCourses.values())

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

  // Fonction pour obtenir le nombre de changements
  const getChangeCount = () => {
    const currentSelectedSet = new Set(selectedCourses.values())
    const toAdd = Array
      .from(currentSelectedSet)
      .filter((id) => !currentSessionIds.has(id)).length
    const toRemove = Array
      .from(currentSessionIds)
      .filter((id) => !currentSelectedSet.has(id)).length
    return { toAdd, toRemove }
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
          {dayOrder.map((day) => (
            <TabsTrigger
              key={day}
              value={day}
              className="text-xs sm:text-sm py-2 px-1 sm:px-3
              data-[state=inactive]:hover:cursor-pointer">
              <div className="flex flex-col items-center gap-1">
                <span>{formatDayLabel(day)}</span>
                <Badge variant="secondary" className="text-xs">
                  {getCourseCount(day)} cours
                </Badge>
              </div>
            </TabsTrigger>
          ))}
        </TabsList>

        {dayOrder.map((day) => (
          <TabsContent key={day} value={day} className="mt-4 sm:mt-6">
            {coursesByDayAndSession[day] && Object.keys(coursesByDayAndSession[day]).length > 0 ? (
              <div className="space-y-6">
                {Object.entries(coursesByDayAndSession[day]).map(([sessionKey, sessionData]) => {
                  const { timeSlot, courses } = sessionData
                  const selectedSessionId = selectedCourses.get(sessionKey)

                  return (
                    <div key={sessionKey} className="space-y-4">
                      {/* En-tête de la session */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-lg font-semibold text-foreground">
                              Créneau {timeSlot.start_time.slice(0, 5)} - {timeSlot.end_time.slice(0, 5)}
                            </h3>
                            {timeSlot.classroom_number && (
                              <p className="text-sm text-muted-foreground">
                                Salle {timeSlot.classroom_number}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-sm">
                              {courses.length} cours disponibles
                            </Badge>
                            {selectedSessionId && (
                              <Badge variant="default" className="text-sm">
                                1 sélectionné
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Grille des cours pour cette session */}
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {courses.map((course) => {
                          const session = course.currentSession
                          const stats = course.stats
                          const isSelected = selectedSessionId === session.id
                          const isCurrentlyEnrolled = currentSessionIds.has(session.id)

                          return (
                            <Card
                              key={course.uniqueKey}
                              className={`group relative overflow-hidden transition-all duration-300
                                hover:shadow-lg border-2 cursor-pointer
                                ${isSelected
                              ? 'border-primary bg-primary/5'
                              : 'border-border hover:border-primary bg-background'
                            }
                                ${isCurrentlyEnrolled ? 'ring-2 ring-green-200' : ''}
                              `}
                              onClick={() => handleCourseSelection(session.id, sessionKey)}
                            >
                              <CardHeader className="pb-4">
                                {/* En-tête avec professeur et matière */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle className="text-lg font-semibold text-foreground mb-1">
                                      {getTeacherName(course)}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                      <Badge variant="outline"
                                        className="text-xs bg-accent border-accent
                                         text-accent-foreground">
                                        {session?.subject} - Niveau {session?.level}
                                      </Badge>
                                      {isCurrentlyEnrolled && (
                                        <Badge variant="secondary" className="text-xs">
                                          Inscrit
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Indicateur de sélection */}
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                                    ${isSelected
                              ? 'bg-primary border-primary text-white'
                              : 'border-muted-foreground'
                            }`}>
                                    {isSelected && (
                                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                              </CardHeader>

                              <CardContent className="pt-0">
                                {/* Statistiques des étudiants */}
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-foreground">
                                      {stats.totalStudents} Étudiants inscrits
                                    </span>
                                  </div>

                                  {/* Répartition par genre */}
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="text-muted-foreground">Répartition</span>
                                      <span className="text-muted-foreground">
                                        Âge moyen: {stats.averageAge} ans
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-primary h-full"
                                          style={{ width: `${stats.percentageBoys}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <GenderDisplay gender="masculin" size="w-3 h-3" />
                                        <span className="font-medium text-foreground">
                                          {stats.countBoys}
                                        </span>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                                        <div
                                          className="bg-secondary h-full"
                                          style={{ width: `${stats.percentageGirls}%` }}
                                        ></div>
                                      </div>
                                      <div className="flex items-center gap-1 text-xs">
                                        <GenderDisplay gender="féminin" size="w-3 h-3" />
                                        <span className="font-medium text-foreground">
                                          {stats.countGirls}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
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
              {selectedCourses.size} sessions sélectionnées
            </span>
            {hasChanges() && (
              <Badge variant="outline">
                {(() => {
                  const { toAdd, toRemove } = getChangeCount()
                  if (toAdd > 0 && toRemove > 0) {
                    return `+${toAdd} -${toRemove}`
                  } else if (toAdd > 0) {
                    return `+${toAdd}`
                  } else if (toRemove > 0) {
                    return `-${toRemove}`
                  }
                  return ''
                })()}
              </Badge>
            )}
          </div>
        </div>

        {/* Liste des cours sélectionnés */}
        {selectedCourses.size > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Array.from(selectedCourses.entries()).map(([sessionKey, sessionId]) => {
              // Trouver les données du cours
              let foundCourse: any = null
              Object.values(coursesByDayAndSession).forEach((daySessions) => {
                Object.values(daySessions).forEach((sessionData) => {
                  const course = sessionData.courses.find((c: any) => c.currentSession.id === sessionId)
                  if (course) foundCourse = course
                })
              })

              if (!foundCourse) return null

              const session = foundCourse.currentSession
              const timeSlot = foundCourse.currentTimeSlot
              const isCurrentlyEnrolled = currentSessionIds.has(sessionId)

              return (
                <div key={sessionId} className="bg-background border rounded-lg p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getTeacherName(foundCourse)}</p>
                      <p className="text-xs text-muted-foreground">
                        {session.subject} - Niveau {session.level}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {timeSlot.start_time.slice(0, 5)} - {timeSlot.end_time.slice(0, 5)}
                      </p>
                    </div>
                    <Badge variant={isCurrentlyEnrolled ? 'secondary' : 'default'} className="text-xs">
                      {isCurrentlyEnrolled ? 'Déjà inscrit' : 'Nouveau'}
                    </Badge>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Message si aucune sélection */}
        {selectedCourses.size === 0 && (
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
            onClick={handleApplyChanges}
            disabled={isLoading || !hasChanges()}
            className="min-w-[120px]"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
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
