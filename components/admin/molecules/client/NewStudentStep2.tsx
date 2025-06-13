'use client'

import {useCallback, useState} from 'react'
import {UseFormReturn} from 'react-hook-form'

import {SubjectNameEnum, TimeSlotEnum} from '@/types/course'
import {TeacherStats} from '@/types/stats'
import {GenderEnum, Teacher} from '@/types/user'

import {TeacherOption} from '@/components/admin/atoms/client/NewStudentTeacherOption'
import {FormData} from '@/components/admin/organisms/client/NewStudentForm'
import {Card} from '@/components/ui/card'
import {FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

import {useCourses} from '@/context/Courses/client'
import {useSchedules} from '@/context/Schedules/client'
import {useStats} from '@/context/Stats/client'
import {formatDayOfWeek} from '@/utils/helpers'

interface StepTwoProps {
  form: UseFormReturn<FormData>
  teachers: Teacher[]
}

export interface TimeSlotSelection {
  dayOfWeek: TimeSlotEnum
  startTime: string
  endTime: string
  subject: SubjectNameEnum
  teacherId: string
}

const StepTwo = ({form, teachers}: StepTwoProps) => {
  const {courses, isLoading: isCoursesLoading} = useCourses()
  const {schedules, isLoading: isSchedulesLoading} = useSchedules()
  const {teacherStats} = useStats()

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

  // Obtenir les professeurs disponibles pour un créneau et une matière donnés
  // Calculer les statistiques pour chaque professeur
  const getAvailableTeachersWithStats = useCallback(
    (startTime: string, endTime: string, subject: SubjectNameEnum) => {
      if (!selectedTimeSlot) return []

      // 1. Trouver les cours correspondant aux critères de recherche
      const matchingCourses = courses.filter((course) =>
        course.sessions.some(
          (session) =>
            session.timeSlot.dayOfWeek === selectedTimeSlot &&
            session.timeSlot.startTime === startTime &&
            session.timeSlot.endTime === endTime &&
            session.subject === subject,
        ),
      )

      // 2. Créer un ensemble d'identifiants d'enseignants uniques
      const teacherIds = new Set<string>()
      matchingCourses.forEach((course) => {
        if (Array.isArray(course.teacher) && course.teacher[0]?._id) {
          teacherIds.add(course.teacher[0]._id)
        } else if (course.teacher && typeof course.teacher === 'object') {
          const id = (course.teacher as any)._id || (course.teacher as any).id
          if (id) teacherIds.add(id)
        }
      })

      // 3. Filtrer les enseignants disponibles
      return teachers
        .filter((teacher) => teacherIds.has(teacher.id) || teacherIds.has(teacher._id))
        .map((teacher) => {
          // 4. Chercher les statistiques correspondantes dans le contexte Stats
          const teacherId = teacher.id || teacher._id
          const statsFromContext = teacherStats.find(
            (stat) =>
              stat && typeof stat === 'object' && 'userId' in stat && stat.userId === teacherId,
          )

          // 5. Créer un objet de statistiques correctement typé
          const defaultStats: TeacherStats = {
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
          }

          // 6. Fusionner avec les stats disponibles, en assurant le bon typage
          const formattedStats: TeacherStats = {...defaultStats}

          if (statsFromContext && typeof statsFromContext === 'object') {
            // Extraire les données pertinentes et les convertir au bon format
            if ('totalStudents' in statsFromContext) {
              formattedStats.totalStudents = Number(statsFromContext.totalStudents) || 0
            }

            if (
              'genderDistribution' in statsFromContext &&
              statsFromContext.genderDistribution &&
              typeof statsFromContext.genderDistribution === 'object'
            ) {
              const genderDist = statsFromContext.genderDistribution

              if (
                'counts' in genderDist &&
                genderDist.counts &&
                typeof genderDist.counts === 'object'
              ) {
                formattedStats.genderDistribution.counts = {
                  [GenderEnum.Masculin]:
                    Number(
                      (genderDist.counts as {[key in GenderEnum]: number})[GenderEnum.Masculin],
                    ) || 0,
                  [GenderEnum.Feminin]:
                    Number(
                      (genderDist.counts as {[key in GenderEnum]: number})[GenderEnum.Feminin],
                    ) || 0,
                  undefined: Number((genderDist.counts as {[key: string]: number})?.undefined) || 0,
                }
              }

              if (
                'percentages' in genderDist &&
                genderDist.percentages &&
                typeof genderDist.percentages === 'object'
              ) {
                formattedStats.genderDistribution.percentages = {
                  [GenderEnum.Masculin]:
                    String(
                      (genderDist.counts as {[key in GenderEnum]: number})[GenderEnum.Masculin],
                    ) || '0',
                  [GenderEnum.Feminin]:
                    String(
                      (genderDist.counts as {[key in GenderEnum]: number})[GenderEnum.Feminin],
                    ) || '0',
                  undefined:
                    String((genderDist.percentages as {[key: string]: string})?.undefined) || '0',
                }
              }
            }

            if ('minAge' in statsFromContext) {
              formattedStats.minAge = Number(statsFromContext.minAge) || 0
            }

            if ('maxAge' in statsFromContext) {
              formattedStats.maxAge = Number(statsFromContext.maxAge) || 0
            }

            if ('averageAge' in statsFromContext) {
              formattedStats.averageAge = Number(statsFromContext.averageAge) || 0
            }
          }

          // 7. Retourner l'enseignant avec des stats correctement typées
          return {
            ...teacher,
            stats: formattedStats,
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
    const teacher = teachers.find((t) => t.id === teacherId || t._id === teacherId)
    return teacher ? `${teacher.firstname} ${teacher.lastname}` : ''
  }

  // Fonction pour gérer la sélection de matière
  function handleSubjectSelect(timeSlotKey: string, subject: SubjectNameEnum) {
    setSubjectSelections((prev) => ({
      ...prev,
      [timeSlotKey]: subject,
    }))
  }

  function getTeacherId(teacher: Teacher | Teacher[]) {
    if (Array.isArray(teacher) && teacher[0]) {
      return teacher[0]._id || teacher[0].id // Gérer les deux possibilités
    }
    return (teacher as any)?._id || (teacher as any)?.id
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <Card className="p-4 md:p-6">
        <div className="text-base md:text-lg font-semibold mb-3 md:mb-4">Sélection du créneau</div>

        <FormField
          control={form.control}
          name="timeSlot"
          render={({field}) => (
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
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <div className="text-sm text-muted-foreground">
              Chargement des créneaux disponibles...
            </div>
          </div>
        </Card>
      ) : (
        selectedTimeSlot &&
        availableSessions.map(({startTime, endTime}, index) => {
          const timeSlotKey = `${startTime}-${endTime}`
          const existingSelection = form
            .getValues('selections')
            .find((s) => s.startTime === startTime && s.endTime === endTime)
          const selectedSubject = existingSelection?.subject || subjectSelections[timeSlotKey]

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
                    render={({field}) => (
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
