'use client'

import {Pencil} from 'lucide-react'
import React, {useState} from 'react'
import {useForm} from 'react-hook-form'

import {toast} from '@/hooks/use-toast'

import {CourseSession, LevelEnum, SubjectNameEnum, TimeSlotEnum} from '@/types/course'
import {Period, PeriodTypeEnum} from '@/types/schedule'

import {Button} from '@/components/ui/button'
import {Card, CardContent} from '@/components/ui/card'
import {Checkbox} from '@/components/ui/checkbox'
import {Dialog, DialogContent, DialogHeader, DialogTitle} from '@/components/ui/dialog'
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {ScrollArea} from '@/components/ui/scroll-area'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

import {useCourses} from '@/context/Courses/client'
import {formatDayOfWeek} from '@/utils/helpers'
import {zodResolver} from '@hookform/resolvers/zod'
import * as z from 'zod'

const sessionSchema = z.object({
  id: z.string(),
  timeSlot: z.object({
    dayOfWeek: z.nativeEnum(TimeSlotEnum),
    startTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
    classroomNumber: z.number().min(1),
  }),
  subject: z.nativeEnum(SubjectNameEnum),
  level: z.nativeEnum(LevelEnum),
})

const formSchema = z.object({
  sessions: z.array(sessionSchema),
  sameStudents: z.boolean().optional(), // Checkbox field
})

type FormData = z.infer<typeof formSchema>

interface SessionsEditorProps {
  timeSlot: TimeSlotEnum
  sessions: CourseSession[]
  periods: Period[] | undefined
}

export const PlanningEditor: React.FC<SessionsEditorProps> = ({timeSlot, sessions, periods}) => {
  const {updateCourse, checkTimeSlotOverlap} = useCourses()

  const [isOpen, setIsOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      sessions: sessions.map((session) => ({
        id: session.id,
        timeSlot: session.timeSlot,
        subject: session.subject,
        level: session.level,
      })),
      sameStudents: sessions.some((session) => session.sameStudents),
    },
  })

  const handleSave = async (data: FormData) => {
    try {
      setIsSubmitting(true)

      for (const session of data.sessions) {
        const hasOverlap = await checkTimeSlotOverlap(session.timeSlot, session.id)

        if (hasOverlap) {
          setIsSubmitting(false)
          return
        }
      }

      await Promise.all(
        data.sessions.map((session) => {
          //todo fix any
          return updateCourse(session.id, session as any, data.sameStudents ?? false)
        }),
      )
    } catch (error) {
      console.error('Erreur:', error)
    } finally {
      setIsSubmitting(false)
      toast({
        title: 'Planning mis à jour',
        description: 'Le planning a bien été mis à jour',
        variant: 'success',
      })
      window.location.reload()
    }
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
      >
        <Pencil className="h-4 w-4" />
        Modifier
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-xl">Planning {formatDayOfWeek(timeSlot)}</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSave)} className="space-y-6">
              <div className="px-4 py-2 flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="sameStudents"
                  render={({field}) => (
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      id="same-students-checkbox"
                    />
                  )}
                />
                <label htmlFor="same-students-checkbox" className="text-sm">
                  Mêmes élèves pour toutes les sessions
                </label>
              </div>

              <ScrollArea className="h-[calc(90vh-8rem)]">
                <div className="grid md:grid-cols-2 gap-4 p-4">
                  {periods &&
                    periods
                      .filter((period) => period.type === PeriodTypeEnum.CLASS)
                      .map((period, index) => (
                        <Card key={period.startTime} className="p-4">
                          <CardContent className="p-0 space-y-4">
                            <div className="font-medium text-lg">
                              {period.startTime} - {period.endTime}
                            </div>

                            <FormField
                              control={form.control}
                              name={`sessions.${index}.subject`}
                              render={({field}) => (
                                <FormItem>
                                  <FormLabel>Matière</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner une matière" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.values(SubjectNameEnum).map((subject) => (
                                        <SelectItem key={subject} value={subject}>
                                          {subject}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`sessions.${index}.level`}
                              render={({field}) => (
                                <FormItem>
                                  <FormLabel>Niveau</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                      <SelectTrigger>
                                        <SelectValue placeholder="Sélectionner un niveau" />
                                      </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                      {Object.values(LevelEnum).map((level) => (
                                        <SelectItem key={level} value={level}>
                                          Niveau {level}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />

                            <FormField
                              control={form.control}
                              name={`sessions.${index}.timeSlot.classroomNumber`}
                              render={({field}) => (
                                <FormItem>
                                  <FormLabel>Salle</FormLabel>
                                  <FormControl>
                                    <Input
                                      type="number"
                                      {...field}
                                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </CardContent>
                        </Card>
                      ))}
                </div>
                <div className="flex justify-end gap-2 sticky bottom-0 bg-white p-4 border-t">
                  <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              </ScrollArea>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
