'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useToast } from '@/client/hooks/use-toast'
import {
  CourseWithRelations,
  SubjectNameEnum,
  TIME_SLOT_SCHEDULE,
  TimeSlotEnum,
} from '@/types/courses'
import { useCourses } from '@/client/context/courses'
import { useTeachers } from '@/client/context/teachers'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { createClient } from '@/client/utils/supabase'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { ChevronRight } from 'lucide-react'
import { SessionConfig } from '@/client/components/root/EditStudentSessionConfig'
import { TimeSlotCard } from '@/server/components/root/EditStudentTimeSlotCard'
import { Button } from '@/client/components/ui/button'
import { Form } from '@/client/components/ui/form'
import { LoadingSpinner } from '@/client/components/ui/loading-spinner'

const sessionSchema = z.object({
  timeSlot: z.nativeEnum(TimeSlotEnum, {
    required_error: 'Veuillez sélectionner un créneau',
  }),
  selections: z.array(
    z.object({
      dayOfWeek: z.nativeEnum(TimeSlotEnum, {
        required_error: 'Le jour est requis',
      }),
      startTime: z.string({ required_error: 'L heure de debut est requise' }),
      endTime: z.string({ required_error: 'L heure de fin est requise' }),
      subject: z.nativeEnum(SubjectNameEnum, {
        required_error: 'La matière est requise',
      }),
      teacherId: z.string().min(1, 'Veuillez sélectionner un professeur'),
    }),
  ),
})

type FormData = z.infer<typeof sessionSchema>

export const EditCourseStudent = ({ studentId }: { studentId: string }) => {
  const router = useRouter()
  const { toast } = useToast()
  const { getStudentCourses, addStudentToCourse, courses } = useCourses()
  const { teachers, getAllTeachers } = useTeachers()
  const supabase = createClient()

  const [existingCourses, setExistingCourses] = useState<CourseWithRelations[]>([])
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlotEnum | ''>('')
  const [pageIsLoading, setPageIsLoading] = useState<boolean>(true)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  const form = useForm<FormData>({
    resolver: zodResolver(sessionSchema),
    defaultValues: {
      timeSlot: undefined,
      selections: [],
    },
  })

  // Configuration des créneaux horaires
  const timeSlotConfigs = useMemo(
    () =>
      Object.entries(TIME_SLOT_SCHEDULE).map(([key, value]) => ({
        id: key as TimeSlotEnum,
        label: formatDayOfWeek(key as TimeSlotEnum),
        sessions: [
          { startTime: value.START, endTime: value.PAUSE },
          { startTime: value.PAUSE, endTime: value.FINISH },
        ],
      })),
    [],
  )

  const createInitialSelections = (
    courses: CourseWithRelations[],
    initialTimeSlot: TimeSlotEnum,
  ) => {
    return courses
      .flatMap((course) =>
        course.courses_sessions
          .filter(
            (session) =>
              session.courses_sessions_students.some((student) => student.users.id === studentId) &&
              session.courses_sessions_timeslot[0].day_of_week === initialTimeSlot,
          )
          .map((session) => ({
            dayOfWeek: initialTimeSlot,
            startTime: session.courses_sessions_timeslot[0].start_time,
            endTime: session.courses_sessions_timeslot[0].end_time,
            subject: session.subject as SubjectNameEnum,
            teacherId: course.courses_teacher[0].users.id,
          })),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const loadData = async () => {
    setPageIsLoading(true)
    try {
      const [courses] = await Promise.all([getStudentCourses(studentId), getAllTeachers()])
      setExistingCourses(courses)

      if (courses.length > 0) {
        const firstCourse = courses[0]
        const firstSession = firstCourse.courses_sessions.find((session) =>
          session.courses_sessions_students.some((student) => student.users.id === studentId),
        )

        if (firstSession) {
          const initialTimeSlot = firstSession.courses_sessions_timeslot[0].day_of_week
          setSelectedTimeSlot(initialTimeSlot)
          form.setValue('timeSlot', initialTimeSlot)

          const initialSelections = courses
            .flatMap((course) =>
              course.courses_sessions
                .filter(
                  (session) =>
                    session.courses_sessions_students.some(
                      (student) => student.users.id === studentId,
                    ) &&
                    session.courses_sessions_timeslot[0].day_of_week === initialTimeSlot,
                )
                .map((session) => ({
                  dayOfWeek: initialTimeSlot,
                  startTime: session.courses_sessions_timeslot[0].start_time,
                  endTime: session.courses_sessions_timeslot[0].end_time,
                  subject: session.subject as SubjectNameEnum,
                  teacherId: course.courses_teacher[0].users.id,
                })),
            )
            .sort((a, b) => a.startTime.localeCompare(b.startTime))

          form.setValue('selections', initialSelections)
        }
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Impossible de charger les données de l\'étudiant',
      })
    } finally {
      setPageIsLoading(false)
    }
  }

  // Chargement initial des données
  useEffect(() => {
    loadData()
  }, [studentId, getStudentCourses, getAllTeachers, toast, form])

  // Mise à jour des sélections lors du changement de créneau
  useEffect(() => {
    if (existingCourses && selectedTimeSlot) {
      const filteredCourses = existingCourses
        .map((course) => ({
          ...course,
          courses_sessions: course.courses_sessions.filter(
            (session) =>
              session.courses_sessions_students.some((student) => student.users.id === studentId) &&
              session.courses_sessions_timeslot[0].day_of_week === selectedTimeSlot,
          ),
        }))
        .filter((course) => course.courses_sessions.length > 0)

      const formattedSelections = filteredCourses
        .flatMap((course) =>
          course.courses_sessions.map((session) => ({
            dayOfWeek: selectedTimeSlot,
            startTime: session.courses_sessions_timeslot[0].start_time,
            endTime: session.courses_sessions_timeslot[0].end_time,
            subject: session.subject as SubjectNameEnum,
            teacherId: course.courses_teacher[0].users.id,
          })),
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      form.setValue('selections', formattedSelections)
      form.setValue('timeSlot', selectedTimeSlot)
    }
  }, [existingCourses, selectedTimeSlot, studentId])

  const getAvailableTeachers = useCallback(
    (subject: SubjectNameEnum, startTime: string, endTime: string) => {
      if (!selectedTimeSlot || !subject) return []

      // Filtrer les cours pour trouver les professeurs qui enseignent la matière demandée
      // sur le créneau horaire spécifique
      const availableTeachers = new Set<string>()

      courses.forEach((course) => {
        course.courses_sessions.forEach((session) => {
          if (
            session.courses_sessions_timeslot[0].day_of_week === selectedTimeSlot &&
            session.subject === subject &&
            session.courses_sessions_timeslot[0].start_time === startTime &&
            session.courses_sessions_timeslot[0].end_time === endTime
          ) {
            const teacherId = course.courses_teacher[0].users.id
            if (teacherId) {
              availableTeachers.add(teacherId)
            }
          }
        })
      })

      return teachers
        .filter((teacher) => availableTeachers.has(teacher.id))
        .sort((a, b) => a.firstname.localeCompare(b.firstname))
    },
    [selectedTimeSlot, courses, teachers],
  )

  function handleTimeSlotChange(value: TimeSlotEnum) {
    setSelectedTimeSlot(value)
    form.setValue('timeSlot', value)

    const timeSlotConfig = timeSlotConfigs.find((config) => config.id === value)
    if (timeSlotConfig) {
      const initialSelections = timeSlotConfig.sessions.map((_session) => ({
        dayOfWeek: value,
        subject: '' as SubjectNameEnum,
        teacherId: '',
        startTime: _session.startTime,
        endTime: _session.endTime,
      }))

      form.setValue('selections', initialSelections)
    }
  }

  function handleTeacherSelect(
    startTime: string,
    endTime: string,
    subject: SubjectNameEnum,
    teacherId: string,
    index: number,
  ) {
    const selections = form.getValues('selections')
    const timeSlot = form.getValues('timeSlot')

    // Mettre à jour uniquement la sélection à l'index spécifié
    form.setValue(`selections.${index}`, {
      ...selections[index],
      dayOfWeek: timeSlot as TimeSlotEnum,
      startTime,
      endTime,
      subject,
      teacherId,
    })
  }

  function handleSubjectSelect(index: number) {
    const selections = form.getValues('selections')
    const subject = form.getValues(`selections.${index}.subject`)
    const timeSlot = form.getValues('timeSlot')

    form.setValue(`selections.${index}`, {
      ...selections[index],
      subject,
      dayOfWeek: timeSlot,
      startTime: selections[index].startTime,
      endTime: selections[index].endTime,
      teacherId: '', // Reset le prof quand on change de matière
    })
  }



  async function onSubmit(data: FormData) {
    try {
      setIsSaving(true)

      // 1. Supprimer les inscriptions qui ne sont plus sélectionnées
      if (existingCourses.length > 0) {
        const oldTeacherId = existingCourses[0].courses_teacher[0].users.id

        const response = await fetch(
          `api/courses/clean?oldTeacherId=${oldTeacherId}&studentId=${studentId}`,
          {
            method: 'DELETE',
          },
        )
        if (response.status !== 200) {
          throw new Error('Erreur lors de la suppression des anciennes sélections')
        }
      }

      // 2. Ajouter les nouvelles sélections
      await Promise.all(
        data.selections.map((selection) => {
          const teacherCourse = courses.find((course) =>
            course.courses_teacher[0].users.id === selection.teacherId,
          )

          if (!teacherCourse) {
            throw new Error(`Cours non trouvé pour le professeur ${selection.teacherId}`)
          }

          return addStudentToCourse(teacherCourse.id, studentId, {
            day_of_week: selection.dayOfWeek as TimeSlotEnum,
            start_time: selection.startTime,
            end_time: selection.endTime,
            subject: selection.subject,
          })
        }),
      )

      toast({
        title: 'Succès',
        variant: 'success',
        description: 'Les modifications ont été enregistrées',
        duration: 5000,
      })
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la sauvegarde',
        duration: 5000,
      })
    } finally {
      setIsSaving(false)
      await new Promise((resolve) => setTimeout(resolve, 2000))
      setTimeout(() => {
        router.push('/admin')
        window.location.reload()
      }, 100)
    }
  }

  if (pageIsLoading) {
    return (
      <div className="w-full h-[400px] flex items-center justify-center">
        <LoadingSpinner text="Chargement des données..." />
      </div>
    )
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-8">
        <div className="space-y-4 md:space-y-6">
          <h2 className="text-base md:text-lg font-medium">Sélectionnez un créneau</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
            {timeSlotConfigs.map((config) => (
              <TimeSlotCard
                key={config.id}
                config={config}
                isSelected={selectedTimeSlot === config.id}
                onSelect={handleTimeSlotChange}
              />
            ))}
          </div>
        </div>

        {selectedTimeSlot && (
          <div className="space-y-4 md:space-y-6">
            <h2 className="text-base md:text-lg font-medium">Configuration des sessions</h2>
            <div className="space-y-3 md:space-y-4">
              {timeSlotConfigs
                .find((c) => c.id === selectedTimeSlot)
                ?.sessions.map((session, index) => (
                  <SessionConfig
                    key={`${selectedTimeSlot}_${index}`}
                    startTime={session.startTime}
                    endTime={session.endTime}
                    form={form}
                    availableTeachers={getAvailableTeachers(
                      form.watch(`selections.${index}.subject`),
                      session.startTime,
                      session.endTime,
                    )}
                    index={index}
                    onSubjectSelect={handleSubjectSelect}
                    onTeacherSelect={handleTeacherSelect}
                  />
                ))}
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-start gap-3 sm:gap-4 pt-4">
          <Button
            type="button"
            variant="destructive"
            onClick={() => router.push(`/admin/root/student/edit/${studentId}`)}
            className="w-full sm:w-auto"
          >
          Annuler
          </Button>
          <Button
            type="submit"
            disabled={isSaving}
            className="w-full sm:w-auto flex items-center justify-center gap-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner className="w-4 h-4" />
                <span>Sauvegarde en cours...</span>
              </>
            ) : (
              <>
                <span>Sauvegarder</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}
