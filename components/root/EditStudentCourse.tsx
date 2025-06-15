'use client'

import { ChevronRight } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'

import { PopulatedCourse, SubjectNameEnum, TIME_SLOT_SCHEDULE } from '@/types/mongo/course'
import { Teacher } from '@/types/mongo/user'

import { SessionConfig } from '@/components/root/EditStudentSessionConfig'
import { TimeSlotCard } from '@/components/root/EditStudentTimeSlotCard'
import { Button } from '@/components/ui/button'
import { Form } from '@/components/ui/form'
import { LoadingSpinner } from '@/components/ui/loading-spinner'

import { useCourses } from '@/context/Courses/client'
import { useTeachers } from '@/context/Teachers/client'
import { fetchWithAuth } from '@/lib/fetchWithAuth'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { TimeSlotEnum } from '@/types/supabase/courses'

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

export const EditCourseStudent = ({ studentId }: {studentId: string}) => {
  const router = useRouter()

  const { toast } = useToast()
  const { getStudentCourses, addStudentToCourse, removeStudentFromCourse, courses } = useCourses()
  const { teachers, getAllTeachers } = useTeachers()

  const [existingCourses, setExistingCourses] = useState<PopulatedCourse[]>([])
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
        label:
          key === TimeSlotEnum.SATURDAY_MORNING
            ? 'Samedi Matin'
            : key === TimeSlotEnum.SATURDAY_AFTERNOON
              ? 'Samedi Après-midi'
              : 'Dimanche Matin',
        sessions: [
          { startTime: value.START, endTime: value.PAUSE },
          { startTime: value.PAUSE, endTime: value.FINISH },
        ],
      })),
    [],
  )

  // Chargement initial des données
  useEffect(() => {
    const loadData = async () => {
      setPageIsLoading(true)
      try {
        const [courses] = await Promise.all([getStudentCourses(studentId), getAllTeachers()])

        setExistingCourses(courses)

        if (courses.length > 0) {
          const firstCourse = courses[0]
          const firstSession = firstCourse.sessions.find((session) =>
            session.students.some((student) => student._id === studentId),
          )

          if (firstSession) {
            const initialTimeSlot = firstSession.timeSlot.dayOfWeek as TimeSlotEnum
            setSelectedTimeSlot(initialTimeSlot)
            form.setValue('timeSlot', initialTimeSlot)

            const initialSelections = courses
              .flatMap((course) =>
                course.sessions
                  .filter(
                    (session) =>
                      session.students.some((student) => student._id === studentId) &&
                      session.timeSlot.dayOfWeek === initialTimeSlot,
                  )
                  .map((session) => ({
                    dayOfWeek: initialTimeSlot,
                    startTime: session.timeSlot.startTime,
                    endTime: session.timeSlot.endTime,
                    subject: session.subject as SubjectNameEnum,
                    teacherId: Array.isArray(course.teacher)
                      ? (course.teacher[0] as Teacher)._id
                      : (course.teacher as Teacher)._id,
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

    loadData()
  }, [studentId, getStudentCourses, getAllTeachers, toast, form])

  // Mise à jour des sélections lors du changement de créneau
  useEffect(() => {
    if (existingCourses && selectedTimeSlot) {
      const filteredCourses = existingCourses
        .map((course: PopulatedCourse) => ({
          ...course,
          sessions: course.sessions.filter(
            (session) =>
              session.students.some((student) => student._id === studentId) &&
              session.timeSlot.dayOfWeek === selectedTimeSlot,
          ),
        }))
        .filter((course) => course.sessions.length > 0)

      const formattedSelections = filteredCourses
        .flatMap((course) =>
          course.sessions.map((session) => ({
            dayOfWeek: selectedTimeSlot as TimeSlotEnum,
            startTime: session.timeSlot.startTime,
            endTime: session.timeSlot.endTime,
            subject: session.subject as SubjectNameEnum,
            teacherId: Array.isArray(course.teacher)
              ? (course.teacher[0] as Teacher)._id
              : (course.teacher as Teacher)._id,
          })),
        )
        .sort((a, b) => a.startTime.localeCompare(b.startTime))

      form.setValue('selections', formattedSelections)
      form.setValue('timeSlot', selectedTimeSlot)
    }
  }, [existingCourses, selectedTimeSlot, studentId])

  // Obtenir les professeurs disponibles pour un créneau et une matière donnés

  const getAvailableTeachers = useCallback(
    (subject: SubjectNameEnum, startTime: string, endTime: string) => {
      if (!selectedTimeSlot || !subject) return []

      // Filtrer les cours pour trouver les professeurs qui enseignent la matière demandée
      // sur le créneau horaire spécifique
      const availableTeachers = new Set<string>()

      courses.forEach((course) => {
        course.sessions.forEach((session) => {
          if (
            session.timeSlot.dayOfWeek === selectedTimeSlot &&
            session.subject === subject &&
            session.timeSlot.startTime === startTime &&
            session.timeSlot.endTime === endTime
          ) {
            const teacherId = Array.isArray(course.teacher)
              ? normalizeTeacherId(course.teacher[0])
              : normalizeTeacherId(course.teacher)

            if (teacherId) {
              availableTeachers.add(teacherId)
            }
          }
        })
      })

      return teachers
        .filter((teacher) => availableTeachers.has(normalizeTeacherId(teacher.id)))
        .sort((a, b) => a.firstname.localeCompare(b.firstname))
    },
    [selectedTimeSlot, courses, teachers],
  )

  function normalizeTeacherId(id: string | any) {
    if (typeof id === 'string') return id
    if (id?._id) return id._id.toString()
    if (id?.toString) return id.toString()
    return id
  }

  // function handleTimeSlotChange(value: TimeSlotEnum) {
  //   setSelectedTimeSlot(value)
  //   form.setValue('timeSlot', value)
  //   form.setValue('selections', [])
  // }

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

    // Mettre à jour uniquement la sélection à l'index spécifié
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

      // console.log('Données soumises:', data.selections)
      // console.log('Cours existants:', existingCourses)

      // 1. Supprimer les inscriptions qui ne sont plus sélectionnées
      if (existingCourses.length > 0) {
        const oldTeacherId =
          Array.isArray(existingCourses[0].teacher) && existingCourses[0].teacher[0]._id

        const response = await fetchWithAuth(
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
      // console.log('\nNouvelles sélections à ajouter:')
      await Promise.all(
        data.selections.map((selection) => {
          // console.log({
          //   teacherId: selection.teacherId,
          //   studentId: studentId,
          //   sessionDetails: {
          //     dayOfWeek: selection.dayOfWeek,
          //     startTime: selection.startTime,
          //     endTime: selection.endTime,
          //     subject: selection.subject,
          //   },
          // })
          // Trouver le cours du professeur
          const teacherCourse = courses.find((course) => {
            return Array.isArray(course.teacher)
              ? course.teacher.some((t) => t._id.toString() === selection.teacherId)
              : course.teacher._id.toString() === selection.teacherId
          })

          // console.log('Found teacher course:', teacherCourse)

          if (!teacherCourse) {
            throw new Error(`Cours non trouvé pour le professeur ${selection.teacherId}`)
          }

          return addStudentToCourse(teacherCourse._id.toString(), studentId, {
            dayOfWeek: selection.dayOfWeek,
            startTime: selection.startTime,
            endTime: selection.endTime,
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
      // router.push(`/admin/root/student/edit/${studentId}`)
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
          {/* Changer la grille pour être en colonne sur mobile */}
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

        {/* Adapter les boutons pour mobile */}
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
