'use client'

import { Calendar, Clock, GraduationCap, Users } from 'lucide-react'
import { useCallback, useMemo,useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { TeacherOption } from '@/client/components/admin/atoms/NewStudentTeacherOption'
import { FormData } from '@/client/components/organisms/NewStudentForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger, SelectValue,
} from '@/client/components/ui/select'
import { useToast } from '@/client/hooks/use-toast'
import { formatDayOfWeek } from '@/server/utils/server-helpers'
import { CourseWithRelations, SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import { DayScheduleWithType } from '@/types/schedule'
import { TeacherStats } from '@/types/stats'
import { TeacherResponse } from '@/types/teacher-payload'
import { GenderEnum } from '@/types/user'

interface StepTwoProps {
  form: UseFormReturn<FormData>
  teachers: (TeacherResponse & {
    stats: { totalStudents: number; totalBoys: number; totalGirls: number }
  })[]
  courses?: CourseWithRelations[]
  schedules?: DayScheduleWithType[] | null
}

export interface TimeSlotSelection {
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  subject: SubjectNameEnum
  teacherId: string
}

const StepTwo = ({ form, teachers, courses = [], schedules }: StepTwoProps) => {
  const { toast } = useToast()
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | null>(null)
  const [selections, setSelections] = useState<TimeSlotSelection[]>([])
  const [subjectSelections, setSubjectSelections] = useState<Record<string, SubjectNameEnum>>({})

  const availableSessions = useMemo(() => {
    if (!selectedTimeSlot || !schedules) return []

    const daySchedule = schedules.find((schedule) => schedule.dayType === selectedTimeSlot)
    if (!daySchedule) return []

    return daySchedule.periods
      .filter((period) => period.type === 'CLASS')
      .map((period) => ({
        startTime: period.startTime,
        endTime: period.endTime,
      }))
  }, [selectedTimeSlot, schedules])

  const isLoading = false // Plus de chargement car les données viennent des props

  const createDefaultTeacherStats = (): TeacherStats => ({
    userId: '',
    totalStudents: 0,
    genderDistribution: {
      counts: {
        [GenderEnum.Masculin]: 0,
        [GenderEnum.Feminin]: 0,
        undefined: 0,
      },
      percentages: {
        [GenderEnum.Masculin]: '0%',
        [GenderEnum.Feminin]: '0%',
        undefined: '0%',
      },
    },
    minAge: 0,
    maxAge: 0,
    averageAge: 0,
  })

  const formatGenderDistribution = (stats: any): TeacherStats['genderDistribution'] => {
    const defaultDistribution = {
      counts: {
        [GenderEnum.Masculin]: 0,
        [GenderEnum.Feminin]: 0,
        undefined: 0,
      },
      percentages: {
        [GenderEnum.Masculin]: '0%',
        [GenderEnum.Feminin]: '0%',
        undefined: '0%',
      },
    }

    if (!stats?.genderDistribution) return defaultDistribution

    const { counts, percentages } = stats.genderDistribution

    const formatCount = (key: GenderEnum | 'undefined') =>
      Number((counts)[key]) || 0

    const formatPercentage = (key: GenderEnum | 'undefined') =>
      String((percentages)[key]) || '0'

    return {
      counts: {
        [GenderEnum.Masculin]: formatCount(GenderEnum.Masculin),
        [GenderEnum.Feminin]: formatCount(GenderEnum.Feminin),
        undefined: formatCount('undefined'),
      },
      percentages: {
        [GenderEnum.Masculin]: formatPercentage(GenderEnum.Masculin),
        [GenderEnum.Feminin]: formatPercentage(GenderEnum.Feminin),
        undefined: formatPercentage('undefined'),
      },
    }
  }

  const formatTeacherStats = (statsFromContext: any): TeacherStats => {
    if (!statsFromContext) return createDefaultTeacherStats()

    return {
      userId: statsFromContext.userId || '',
      totalStudents: Number(statsFromContext.totalStudents) || 0,
      genderDistribution: formatGenderDistribution(statsFromContext),
      minAge: Number(statsFromContext.minAge) || 0,
      maxAge: Number(statsFromContext.maxAge) || 0,
      averageAge: Number(statsFromContext.averageAge) || 0,
    }
  }

  const normalizeTime = (time: string) => {
    // Enlever les secondes si présentes (ex: "14:00:00" -> "14:00")
    return time.split(':').slice(0, 2).join(':')
  }

  // Obtenir les professeurs disponibles pour un créneau et une matière donnés
  const getAvailableTeachersWithStats = useCallback(
    (startTime: string, endTime: string, subject: SubjectNameEnum) => {
      if (!selectedTimeSlot) return []

      // Normaliser les heures pour la comparaison
      const normalizedStartTime = normalizeTime(startTime)
      const normalizedEndTime = normalizeTime(endTime)

      // 1. Trouver les cours correspondant aux critères de recherche
      const matchingCourses = courses.filter((course) =>
        course.courses_sessions.some(
          (session) => {
            const sessionStartTime = normalizeTime(session.courses_sessions_timeslot[0].start_time)
            const sessionEndTime = normalizeTime(session.courses_sessions_timeslot[0].end_time)

            return session.courses_sessions_timeslot[0].day_of_week === selectedTimeSlot &&
              sessionStartTime === normalizedStartTime &&
              sessionEndTime === normalizedEndTime &&
              session.subject === subject
          },
        ),
      )

      // 2. Créer un ensemble d'identifiants d'enseignants uniques
      const teacherIds = new Set<string>()
      matchingCourses.forEach((course) => {
        if (Array.isArray(course.courses_teacher) && course.courses_teacher[0]?.users?.id) {
          teacherIds.add(course.courses_teacher[0].users.id)
        } else if (course.courses_teacher && typeof course.courses_teacher === 'object') {
          const id = (course.courses_teacher as any).users.id
          if (id) teacherIds.add(id)
        }
      })

      // 3. Filtrer les enseignants disponibles et utiliser leurs stats des props
      return teachers
        .filter((teacher) => teacherIds.has(teacher.id))
        .map((teacher) => {
          // Utiliser les stats déjà calculées dans les props
          return {
            ...teacher,
            stats: {
              userId: teacher.id,
              totalStudents: teacher.stats.totalStudents,
              genderDistribution: {
                counts: {
                  [GenderEnum.Masculin]: teacher.stats.totalBoys,
                  [GenderEnum.Feminin]: teacher.stats.totalGirls,
                  undefined: teacher.stats.totalStudents - teacher.stats.totalBoys - teacher.stats.totalGirls,
                },
                percentages: {
                  [GenderEnum.Masculin]: teacher.stats.totalStudents > 0 ?
                    `${Math.round((teacher.stats.totalBoys / teacher.stats.totalStudents) * 100)}%` : '0%',
                  [GenderEnum.Feminin]: teacher.stats.totalStudents > 0 ?
                    `${Math.round((teacher.stats.totalGirls / teacher.stats.totalStudents) * 100)}%` : '0%',
                  undefined: teacher.stats.totalStudents > 0 ?
                    `${Math.round(((teacher.stats.totalStudents - teacher.stats.totalBoys - teacher.stats.totalGirls) / teacher.stats.totalStudents) * 100)}%` : '0%',
                },
              },
              minAge: 0,
              maxAge: 0,
              averageAge: 0,
            },
          }
        })
        .sort((a, b) => a.firstname.localeCompare(b.firstname))
    },
    [selectedTimeSlot, courses, teachers],
  )

  function handleTimeSlotChange(value: TimeSlotEnum) {
    setSelectedTimeSlot(value)
    setSelections([])
    form.setValue('selections', [])
  }

  function handleTeacherSelect(
    startTime: string,
    endTime: string,
    subject: SubjectNameEnum,
    teacherId: string,
  ) {
    if (!selectedTimeSlot) return

    const newSelection = {
      dayOfWeek: selectedTimeSlot,
      startTime,
      endTime,
      subject,
      teacherId,
    }

    const currentSelections = [...selections]
    const existingIndex = currentSelections.findIndex(
      (s) => s.startTime === startTime && s.endTime === endTime,
    )

    if (existingIndex >= 0) {
      currentSelections[existingIndex] = newSelection
    } else {
      currentSelections.push(newSelection)
    }
    setSelections(currentSelections)
    form.setValue('selections', currentSelections)
    form.trigger('selections')
  }

  function getTeacherName(teacherId: string) {
    const teacher = teachers.find((t) => t.id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : ''
  }

  // Fonction pour gérer la sélection de matière
  function handleSubjectSelect(timeSlotKey: string, subject: SubjectNameEnum) {
    setSubjectSelections((prev) => ({
      ...prev,
      [timeSlotKey]: subject,
    }))
  }

  return (
    <div className="space-y-6">
      {/* Sélection du créneau */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="w-5 h-5 text-primary" />
            Sélection du créneau
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="timeSlot"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Jour *</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(value)
                    handleTimeSlotChange(value as TimeSlotEnum)
                  }}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sélectionner un jour" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(TimeSlotEnum).map((timeSlot) => (
                      <SelectItem key={timeSlot} value={timeSlot}>
                        {formatDayOfWeek(timeSlot)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Créneaux disponibles */}
      {selectedTimeSlot && isLoading ? (
        <Card>
          <CardContent className="flex justify-center items-center min-h-[200px] p-6">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent
              rounded-full animate-spin" />
              <div className="text-sm text-muted-foreground">
                Chargement des créneaux disponibles...
              </div>
            </div>
          </CardContent>
        </Card>
      ) : selectedTimeSlot && availableSessions.length === 0 ? (
        <Card>
          <CardContent className="flex justify-center items-center min-h-[200px] p-6">
            <div className="text-center">
              <div className="text-sm text-muted-foreground">
                Aucun créneau de cours disponible pour {formatDayOfWeek(selectedTimeSlot)}
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Debug: schedules={schedules?.length}, selectedTimeSlot={selectedTimeSlot}
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        selectedTimeSlot && availableSessions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="w-5 h-5 text-primary" />
                Créneaux disponibles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {availableSessions.map(({ startTime, endTime }, index) => {
                const timeSlotKey = `${startTime}-${endTime}`
                const existingSelection = form
                  .getValues('selections')
                  .find((s) =>
                    s.startTime === startTime && s.endTime === endTime,
                  )
                const selectedSubject = existingSelection?.subject ??
                  subjectSelections[timeSlotKey]

                return (
                  <div key={`${startTime}-${endTime}`} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium text-base">
                        {startTime} - {endTime}
                      </div>
                    </div>

                    {/* Sélection de la matière */}
                    <div className="space-y-2">
                      <FormLabel>Matière *</FormLabel>
                      <Select
                        value={selectedSubject}
                        onValueChange={(value: SubjectNameEnum) => {
                          handleSubjectSelect(timeSlotKey, value)
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner une matière" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(SubjectNameEnum).map((subject) => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Sélection du professeur */}
                    {selectedSubject && (
                      <FormField
                        control={form.control}
                        name={`selections.${index}.teacherId`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Professeur *</FormLabel>
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value)
                                handleTeacherSelect(startTime, endTime, selectedSubject, value)
                              }}
                              value={form.getValues(`selections.${index}.teacherId`)}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Sélectionner un professeur">
                                    {field.value ? getTeacherName(field.value) :
                                      ''}
                                  </SelectValue>
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAvailableTeachersWithStats(startTime, endTime, selectedSubject)
                                  .map(
                                    (teacher) => (
                                      <SelectItem
                                        key={teacher.id}
                                        value={teacher.id}
                                        className="py-2 md:py-3"
                                      >
                                        <TeacherOption teacher={teacher} />
                                      </SelectItem>
                                    ),
                                  )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                )
              })}
            </CardContent>
          </Card>
        )
      )}

      {/* Récapitulatif */}
      {selections.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="w-5 h-5 text-primary" />
              Récapitulatif des sélections
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="font-medium text-base">
              {formatDayOfWeek(selectedTimeSlot as TimeSlotEnum)}
            </div>
            <div className="space-y-3">
              {selections.map((selection, index) => (
                <div key={index} className="pl-4 border-l-2 border-primary bg-primary/5
                p-3 rounded-r-lg"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-primary" />
                    <span className="font-medium text-sm">
                      {selection.startTime} - {selection.endTime}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-4 h-4 text-primary" />
                    <span className="text-sm text-muted-foreground">
                      {selection.subject}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">Professeur :</span>{' '}
                    {selection.teacherId && getTeacherName(selection.teacherId)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default StepTwo
