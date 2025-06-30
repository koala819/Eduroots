'use client'

import { Plus } from 'lucide-react'
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
import { addStudentToCourse, removeStudentFromCourse } from '@/server/actions/api/courses'
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
  studentId: string
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
}

export const EditCourseStudent = ({
  studentId,
  allCoursesData,
  studentCoursesData,
}: EditCourseStudentProps) => {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('saturday_morning')


  // État des inscriptions actuelles de l'étudiant (à récupérer depuis une API)
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set())

  // Calculer les statistiques pour chaque cours
  const calculateCourseStats = (course: CourseWithCompleteTimeRanges) => {
    // Utiliser un Map pour dédupliquer les étudiants par student_id
    const uniqueStudents = new Map<string, { date_of_birth: string; gender: string }>()

    course.courses_sessions.forEach((session) => {
      session.courses_sessions_students?.forEach((enrollment) => {
        if (enrollment.users && !uniqueStudents.has(enrollment.student_id)) {
          const dateOfBirth = enrollment.users.date_of_birth ?
            enrollment.users.date_of_birth.toString() : ''
          uniqueStudents.set(enrollment.student_id, {
            date_of_birth: dateOfBirth,
            gender: enrollment.users.gender || 'undefined',
          })
        }
      })
    })

    // Convertir le Map en tableau
    const allStudents = Array.from(uniqueStudents.values())

    // Calculer l'âge moyen
    const validStudents = allStudents.filter((s) => s.date_of_birth)
    const totalAge = validStudents.reduce((sum, student) => {
      const birthDate = new Date(student.date_of_birth)
      const age = new Date().getFullYear() - birthDate.getFullYear()
      return sum + age
    }, 0)
    const averageAge = validStudents.length > 0 ? Math.round(totalAge / validStudents.length) : 0

    // Calculer la répartition par genre (corriger avec les bonnes valeurs)
    const totalStudents = allStudents.length
    const countBoys = allStudents.filter((s) =>
      s.gender === 'masculin' || s.gender === 'male' || s.gender === 'M',
    ).length
    const countGirls = allStudents.filter((s) =>
      s.gender === 'féminin' || s.gender === 'female' || s.gender === 'F',
    ).length
    const countUndefined = totalStudents - countBoys - countGirls

    const percentageBoys = totalStudents > 0 ? Math.round((countBoys / totalStudents) * 100) : 0
    const percentageGirls = totalStudents > 0 ? Math.round((countGirls / totalStudents) * 100) : 0

    return {
      totalStudents,
      averageAge,
      countBoys,
      countGirls,
      countUndefined,
      percentageBoys,
      percentageGirls,
    }
  }

  // Organiser les cours par jour et par session (créneau horaire)
  const coursesByDayAndSession = allCoursesData.existingCourses.reduce((acc, course) => {
    course.courses_sessions.forEach((session) => {
      session.courses_sessions_timeslot?.forEach((timeslot) => {
        const dayOfWeek = timeslot.day_of_week
        if (!acc[dayOfWeek]) {
          acc[dayOfWeek] = {}
        }

        // Créer une clé pour la session basée sur l'heure
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

        // Ajouter ce cours à cette session
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

  // Calculer le nombre total de cours par jour (pas de sessions)
  const getCourseCount = (day: string) => {
    const daySessions = coursesByDayAndSession[day]
    if (!daySessions) return 0

    // Compter tous les cours de toutes les sessions
    return Object.values(daySessions).reduce((total, sessionData) => {
      return total + sessionData.courses.length
    }, 0)
  }

  const handleToggleCourse = async (courseId: string) => {
    setIsLoading(true)

    try {
      const course = allCoursesData.existingCourses.find((c) => c.id === courseId)
      if (!course) return

      const session = course.courses_sessions[0]
      const timeslot = session?.courses_sessions_timeslot[0]

      if (!session || !timeslot) {
        throw new Error('Données de session manquantes')
      }

      const isCurrentlyEnrolled = enrolledCourseIds.has(courseId)

      if (isCurrentlyEnrolled) {
        // Désinscrire l'étudiant
        const result = await removeStudentFromCourse(courseId, studentId)
        if (result.success) {
          setEnrolledCourseIds((prev) => {
            const newSet = new Set(prev)
            newSet.delete(courseId)
            return newSet
          })
          toast({
            title: 'Désinscription réussie',
            description: `Étudiant retiré du cours ${session.subject}`,
            variant: 'success',
          })
        } else {
          throw new Error(result.message)
        }
      } else {
        // Inscrire l'étudiant
        const result = await addStudentToCourse(courseId, studentId, {
          day_of_week: timeslot.day_of_week as any,
          start_time: timeslot.start_time,
          end_time: timeslot.end_time,
          subject: session.subject,
        })

        if (result.success) {
          setEnrolledCourseIds((prev) => new Set([...prev, courseId]))
          toast({
            title: 'Inscription réussie',
            description: `Étudiant inscrit au cours ${session.subject}`,
            variant: 'success',
          })
        } else {
          throw new Error(result.message)
        }
      }
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

  const getCourseTime = (course: any) => {
    const session = course.currentSession
    const timeslots = course.currentTimeSlots || session?.courses_sessions_timeslot || []

    if (timeslots.length === 0) {
      return ''
    }

    // Trier les créneaux par heure de début
    const sortedTimeslots = timeslots.sort((a: any, b: any) =>
      a.start_time.localeCompare(b.start_time),
    )

    // Afficher tous les créneaux
    if (sortedTimeslots.length === 1) {
      const timeslot = sortedTimeslots[0]
      return `${timeslot.start_time.slice(0, 5)} - ${timeslot.end_time.slice(0, 5)}`
    } else {
      // Plusieurs créneaux : afficher le premier et le dernier
      const first = sortedTimeslots[0]
      const last = sortedTimeslots[sortedTimeslots.length - 1]
      return `${first.start_time.slice(0, 5)} - ${last.end_time.slice(0, 5)}`
    }
  }


  const dayOrder = ['saturday_morning', 'saturday_afternoon', 'sunday_morning']

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
          Sélectionnez le cours auquel vous souhaitez inscrire l&apos;étudiant
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
                  {getCourseCount(day)/2} cours
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

                  return (
                    <div key={sessionKey} className="space-y-4">
                      {/* En-tête de la session */}
                      <div className="bg-muted/50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold">
                              Créneau {timeSlot.start_time.slice(0, 5)}{' '}
                              - {timeSlot.end_time.slice(0, 5)}
                            </h3>
                            {/* {timeSlot.classroom_number && (
                              <p className="text-sm text-muted-foreground">
                                Salle {timeSlot.classroom_number}
                              </p>
                            )} */}
                          </div>
                          {/* <Badge variant="outline" className="text-sm">
                            {courses.length} cours disponibles
                          </Badge> */}
                        </div>
                      </div>

                      {/* Grille des cours pour cette session */}
                      <div
                        className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                        {courses.map((course) => {
                          const session = course.currentSession
                          const stats = calculateCourseStats(course)

                          return (
                            <Card
                              key={course.uniqueKey}
                              className='group relative overflow-hidden transition-all duration-300
                                hover:shadow-lg border-2 border-border hover:border-primary
                                bg-background'
                            >
                              <CardHeader className="pb-4">
                                {/* En-tête avec professeur et matière */}
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    <CardTitle
                                      className="text-lg font-semibold text-foreground mb-1">
                                      {getTeacherName(course)}
                                    </CardTitle>
                                    <div className="flex items-center gap-2 text-sm
                                    text-muted-foreground">
                                      <Badge variant="outline"
                                        className={`text-xs ${getSubjectColors(session?.subject)}`}>
                                        {session?.subject} - Niveau {session?.level}
                                      </Badge>
                                    </div>
                                  </div>

                                  {/* Bouton d'action */}
                                  <Button
                                    size="sm"
                                    variant='default'
                                    onClick={() => handleToggleCourse(course.id)}
                                    disabled={isLoading}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    <span className="hidden sm:inline">Changer</span>
                                  </Button>
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
                                      <div className="flex-1 bg-muted rounded-full h-2
                                      overflow-hidden">
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
                                      <div className="flex-1 bg-muted rounded-full h-2
                                      overflow-hidden">
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
    </div>
  )
}
