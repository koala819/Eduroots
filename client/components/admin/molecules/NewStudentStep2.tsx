'use client'

import { useCallback, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { TeacherOption } from '@/client/components/admin/atoms/NewStudentTeacherOption'
import { FormData } from '@/client/components/organisms/NewStudentForm'
import { Card } from '@/client/components/ui/card'
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
import { useCourses } from '@/client/context/courses'
import { useSchedules } from '@/client/context/schedules'
import { useStats } from '@/client/context/stats'
import { formatDayOfWeek } from '@/client/utils/timeSlots'
import { SubjectNameEnum,TimeSlotEnum } from '@/types/courses'
import { TeacherStats } from '@/types/stats'
import { TeacherResponse } from '@/types/teacher-payload'
import { GenderEnum } from '@/types/user'

interface StepTwoProps {
  form: UseFormReturn<FormData>
  teachers: TeacherResponse[]
}

export interface TimeSlotSelection {
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  subject: SubjectNameEnum
  teacherId: string
}

const StepTwo = ({ form, teachers }: StepTwoProps) => {
  const { courses, isLoading: isCoursesLoading } = useCourses()
  const { schedules, isLoading: isSchedulesLoading } = useSchedules()
  const { teacherStats } = useStats()

  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | ''>(
    form.getValues('timeSlot') || '',
  )
  const [subjectSelections, setSubjectSelections] = useState<{
    [key: string]: SubjectNameEnum
  }>(() => {
    const selections = form.getValues('selections')
    return selections.reduce(
      (acc, sel) => ({
        ...acc,
        [`${sel.startTime}-${sel.endTime}`]: sel.subject,
      }),
      {},
    )
  })
  const [selections, setSelections] = useState<TimeSlotSelection[]>(form.getValues('selections'))

  const isLoading = isCoursesLoading || isSchedulesLoading

  // Récupérer les sessions uniques pour le jour sélectionné
  const availableSessions = selectedTimeSlot ? schedules[selectedTimeSlot]?.periods || [] : []

  const createDefaultTeacherStats = (): TeacherStats => ({
    totalStudents: 0,
    genderDistribution: {
      counts: {
        [GenderEnum.Masculin]: 0,
        [GenderEnum.Feminin]: 0,
        undefined: 0,
      },
      percentages: {
        [GenderEnum.Masculin]: '0',
        [GenderEnum.Feminin]: '0',
        undefined: '0',
      },
    },
    minAge: 0,
    maxAge: 0,
    averageAge: 0,
  })

  const formatGenderDistribution = (stats: any): TeacherStats['genderDistribution'] => {
    const defaultDist = createDefaultTeacherStats().genderDistribution

    if (!stats?.genderDistribution || typeof stats.genderDistribution !== 'object') {
      return defaultDist
    }

    const genderDist = stats.genderDistribution
    const counts = genderDist.counts && typeof genderDist.counts === 'object'
      ? genderDist.counts
      : {}
    const percentages = genderDist.percentages && typeof genderDist.percentages === 'object'
      ? genderDist.percentages
      : {
        [GenderEnum.Masculin]: '0',
        [GenderEnum.Feminin]: '0',
        undefined: '0',
      }

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
    const formattedStats = createDefaultTeacherStats()

    if (!statsFromContext || typeof statsFromContext !== 'object') {
      return formattedStats
    }

    return {
      ...formattedStats,
      totalStudents: Number(statsFromContext.totalStudents) || 0,
      genderDistribution: formatGenderDistribution(statsFromContext),
      minAge: Number(statsFromContext.minAge) || 0,
      maxAge: Number(statsFromContext.maxAge) || 0,
      averageAge: Number(statsFromContext.averageAge) || 0,
    }
  }

  // Obtenir les professeurs disponibles pour un créneau et une matière donnés
  // Calculer les statistiques pour chaque professeur
  const getAvailableTeachersWithStats = useCallback(
    (startTime: string, endTime: string, subject: SubjectNameEnum) => {
      if (!selectedTimeSlot) return []

      // 1. Trouver les cours correspondant aux critères de recherche
      const matchingCourses = courses.filter((course) =>
        course.courses_sessions.some(
          (session) =>
            session.courses_sessions_timeslot[0].day_of_week === selectedTimeSlot &&
            session.courses_sessions_timeslot[0].start_time === startTime &&
            session.courses_sessions_timeslot[0].end_time === endTime &&
            session.subject === subject,
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

      // 3. Filtrer les enseignants disponibles
      return teachers
        .filter((teacher) => teacherIds.has(teacher.id))
        .map((teacher) => {
          // 4. Chercher les statistiques correspondantes dans le contexte Stats
          const teacherId = teacher.id
          const statsFromContext = teacherStats.find(
            (stat) =>
              stat && typeof stat === 'object' && 'userId' in stat && stat.userId === teacherId,
          )

          // 5. Retourner l'enseignant avec des stats correctement typées
          return {
            ...teacher,
            stats: formatTeacherStats(statsFromContext),
          }
        })
        .sort((a, b) => a.firstname.localeCompare(b.firstname))
    },
    [selectedTimeSlot, courses, teachers, teacherStats],
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
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="text-base md:text-lg font-semibold mb-3 md:mb-4">Sélection du créneau</div>

        <FormField
          control={form.control}
          name="timeSlot"
          render={({ field }) => (
            <FormItem className="space-y-3 md:space-y-4">
              <FormLabel>Jour</FormLabel>
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
      </Card>

      {selectedTimeSlot && isLoading ? (
        <Card className="p-4 md:p-6 flex justify-center items-center min-h-[200px]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent
             rounded-full animate-spin" />
            <div className="text-sm text-muted-foreground">
              Chargement des créneaux disponibles...
            </div>
          </div>
        </Card>
      ) : (
        selectedTimeSlot &&
        availableSessions.map(({ startTime, endTime }, index) => {
          const timeSlotKey = `${startTime}-${endTime}`
          const existingSelection = form
            .getValues('selections')
            .find((s) => s.startTime === startTime && s.endTime === endTime)
          const selectedSubject = existingSelection?.subject ?? subjectSelections[timeSlotKey]

          return (
            <Card key={`${startTime}-${endTime}`} className="p-4 md:p-6">
              <div className="flex flex-col space-y-4">
                <div className="flex flex-col md:flex-row md:justify-between md:items-center">
                  <div className="font-medium text-sm md:text-base">
                    {startTime} - {endTime}
                  </div>
                </div>

                {/* Sélection de la matière */}
                <div className="space-y-2">
                  <FormLabel>Matière</FormLabel>
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
                        <FormLabel>Professeur</FormLabel>
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
                                {field.value ? getTeacherName(field.value) : ''}
                              </SelectValue>
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getAvailableTeachersWithStats(startTime, endTime, selectedSubject).map(
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
            </Card>
          )
        })
      )}
      {selections.length > 0 && (
        <Card className="p-4 md:p-6 bg-muted">
          <div className="text-base md:text-lg font-semibold mb-3 md:mb-4">Récapitulatif</div>
          <div className="space-y-3 md:space-y-4">
            <div className="font-medium">{formatDayOfWeek(selectedTimeSlot as TimeSlotEnum)}</div>
            <div className="grid gap-3 md:gap-4">
              {selections.map((selection, index) => (
                <div key={index} className="pl-3 md:pl-4 border-l-2 border-primary">
                  <div className="font-medium text-sm md:text-base">
                    {selection.startTime} - {selection.endTime}
                  </div>
                  <div className="text-xs md:text-sm text-muted-foreground">
                    {selection.subject}
                  </div>
                  <div className="text-xs md:text-sm">
                    Prof : {selection.teacherId && getTeacherName(selection.teacherId)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

export default StepTwo
