'use client'

import { Plus, Trash2 } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/client/components/ui/select'
import {
  LevelEnum,
  SubjectNameEnum,
  TIME_SLOT_SCHEDULE,
  TimeSlotEnum,
} from '@/types/courses'

interface TeacherFormData {
  firstname: string
  lastname: string
  email: string
  sessions: {
    dayOfWeek: TimeSlotEnum
    timeSlot: {
      startTime: string
      endTime: string
      classroomNumber: number | null
    }
    subject: SubjectNameEnum | null
    level: LevelEnum | null
  }[]
}

interface StepTwoProps {
  form: UseFormReturn<TeacherFormData>
}

interface TimeSlotOption {
  value: string
  label: string
  start: string
  end: string
}

const getTimeSlotOptions = (dayOfWeek: TimeSlotEnum): TimeSlotOption[] => {
  const schedule = TIME_SLOT_SCHEDULE[dayOfWeek]
  return [
    {
      value: `${schedule.START}-${schedule.PAUSE}`,
      label: `${schedule.START} - ${schedule.PAUSE} (1ère heure)`,
      start: schedule.START,
      end: schedule.PAUSE,
    },
    {
      value: `${schedule.PAUSE}-${schedule.FINISH}`,
      label: `${schedule.PAUSE} - ${schedule.FINISH} (2ème heure)`,
      start: schedule.PAUSE,
      end: schedule.FINISH,
    },
    {
      value: `${schedule.START}-${schedule.FINISH}`,
      label: `${schedule.START} - ${schedule.FINISH} (Double heure)`,
      start: schedule.START,
      end: schedule.FINISH,
    },
  ]
}

const daysDisplay = {
  [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi Matin',
  [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi Après-midi',
  [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche Matin',
}

const StepTwo = ({ form }: StepTwoProps) => {
  const sessions = form.watch('sessions') || []

  const addSession = () => {
    const newSession = {
      dayOfWeek: TimeSlotEnum.SATURDAY_MORNING,
      timeSlot: {
        startTime: TIME_SLOT_SCHEDULE[TimeSlotEnum.SATURDAY_MORNING].START,
        endTime: TIME_SLOT_SCHEDULE[TimeSlotEnum.SATURDAY_MORNING].PAUSE,
        classroomNumber: null,
      },
      subject: null,
      level: null,
    }
    form.setValue('sessions', [...sessions, newSession])
  }

  const removeSession = (index: number) => {
    const updatedSessions = sessions.filter((_, i) => i !== index)
    form.setValue('sessions', updatedSessions)
  }

  const updateTimeSlot = (sessionIndex: number, timeSlotValue: string) => {
    const [start, end] = timeSlotValue.split('-')
    const currentSessions = form.getValues('sessions')
    const updatedSessions = [...currentSessions]

    updatedSessions[sessionIndex] = {
      ...updatedSessions[sessionIndex],
      timeSlot: {
        ...updatedSessions[sessionIndex].timeSlot,
        startTime: start,
        endTime: end,
      },
    }

    form.setValue('sessions', updatedSessions)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Sessions d'enseignement
          </h3>
          <p className="text-sm text-muted-foreground">
            Configurez les matières, niveaux et créneaux horaires
          </p>
        </div>
        <Button
          type="button"
          onClick={addSession}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Ajouter session
        </Button>
      </div>

      {sessions.length === 0 && (
        <Card className="border-dashed border-2 border-muted">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-muted-foreground text-center">
              Aucune session configurée.
              <br />
              Cliquez sur "Ajouter session" pour commencer.
            </p>
          </CardContent>
        </Card>
      )}

      <FormField
        control={form.control}
        name="sessions"
        render={({ field }) => (
          <div className="space-y-4">
            {field.value.map((session, sessionIndex) => (
              <Card key={sessionIndex} className="relative">
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">
                      Session {sessionIndex + 1}
                    </CardTitle>
                    {sessions.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSession(sessionIndex)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Première ligne : Matière et Niveau */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`sessions.${sessionIndex}.subject`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Matière *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                      name={`sessions.${sessionIndex}.level`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Niveau *
                          </FormLabel>
                          <Select onValueChange={field.onChange} value={field.value || ''}>
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
                  </div>

                  {/* Deuxième ligne : Jour et Créneau */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`sessions.${sessionIndex}.dayOfWeek`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Jour *
                          </FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value)
                              // Reset time slot when day changes
                              const schedule = TIME_SLOT_SCHEDULE[value as TimeSlotEnum]
                              const currentSessions = form.getValues('sessions')
                              const updatedSessions = [...currentSessions]
                              updatedSessions[sessionIndex] = {
                                ...updatedSessions[sessionIndex],
                                timeSlot: {
                                  ...updatedSessions[sessionIndex].timeSlot,
                                  startTime: schedule.START,
                                  endTime: schedule.PAUSE,
                                },
                              }
                              form.setValue('sessions', updatedSessions)
                            }}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un jour" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(daysDisplay).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {label}
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
                      name={`sessions.${sessionIndex}.timeSlot`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Créneau horaire *
                          </FormLabel>
                          <Select
                            onValueChange={(value) => updateTimeSlot(sessionIndex, value)}
                            value={`${session.timeSlot.startTime}-${session.timeSlot.endTime}`}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Sélectionner un créneau" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {getTimeSlotOptions(session.dayOfWeek).map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Troisième ligne : Salle */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name={`sessions.${sessionIndex}.timeSlot.classroomNumber`}
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium">
                            Numéro de salle
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              placeholder="Ex: 101"
                              {...field}
                              value={field.value ?? ''}
                              onChange={(e) =>
                                field.onChange(e.target.value ? parseInt(e.target.value) : null)
                              }
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />

      {sessions.length > 0 && (
        <div className="flex justify-center">
          <Button
            type="button"
            onClick={addSession}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Ajouter une autre session
          </Button>
        </div>
      )}
    </div>
  )
}

export default StepTwo
