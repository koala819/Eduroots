import { useEffect, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { LevelEnum, SubjectNameEnum, TIME_SLOT_SCHEDULE, TimeSlotEnum } from '@/zUnused/mongo/course'

import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import { Checkbox } from '@/client/components/ui/checkbox'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/components/ui/select'

import { TeacherFormData } from './EditTeacherForm'

import { formatDayOfWeek } from '@/server/utils/helpers'

interface EditTeacherStep2Props {
  form: UseFormReturn<TeacherFormData>
}

const EditTeacherStep2 = ({ form }: EditTeacherStep2Props) => {
  const [selectedDays, setSelectedDays] = useState<TimeSlotEnum[]>([])

  useEffect(() => {
    // Initialiser les jours sélectionnés à partir des sessions existantes
    const sessions = form.getValues('sessions')
    // console.log('Initial sessions:', sessions.length)

    if (sessions.length > 0) {
      const uniqueDays = Array.from(new Set(sessions.map((session) => session.dayOfWeek)))
      // console.log('Unique days:', uniqueDays)
      setSelectedDays(uniqueDays)
    }
  }, [form])

  const handleDayChange = (day: TimeSlotEnum, checked: boolean) => {
    let updatedDays: TimeSlotEnum[]
    let updatedSessions = [...form.getValues('sessions')]

    // console.log('Current sessions before update:', updatedSessions.length)

    if (checked) {
      updatedDays = [...selectedDays, day]
      // Ajouter de nouvelles sessions pour le jour sélectionné
      const daySchedule = TIME_SLOT_SCHEDULE[day]
      const newSessions = [
        {
          dayOfWeek: day,
          timeSlot: {
            startTime: daySchedule.START,
            endTime: daySchedule.PAUSE,
            classroomNumber: 1,
          },
          subject: SubjectNameEnum.Arabe,
          level: LevelEnum.Zero,
        },
        {
          dayOfWeek: day,
          timeSlot: {
            startTime: daySchedule.PAUSE,
            endTime: daySchedule.FINISH,
            classroomNumber: 1,
          },
          subject: SubjectNameEnum.Arabe,
          level: LevelEnum.Zero,
        },
      ]
      updatedSessions = [...updatedSessions, ...newSessions]
      // console.log('Sessions after update:', updatedSessions.length)
    } else {
      updatedDays = selectedDays.filter((d) => d !== day)
      // Supprimer les sessions du jour désélectionné
      updatedSessions = updatedSessions.filter((session) => session.dayOfWeek !== day)
      // console.log('Sessions after unchecking:', updatedSessions.length)
    }

    setSelectedDays(updatedDays)
    form.setValue('sessions', updatedSessions, { shouldValidate: true })
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Label className="text-base font-semibold block mb-4">Jours d&apos;enseignement</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.values(TimeSlotEnum).map((day) => (
            <div
              key={day}
              className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Checkbox
                checked={selectedDays.includes(day)}
                onCheckedChange={(checked) => handleDayChange(day, checked as boolean)}
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium">{formatDayOfWeek(day)}</Label>
            </div>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="sessions"
        render={() => (
          <div className="space-y-8">
            {selectedDays.map((day) => (
              <Card key={day} className="border-2 bg-white shadow-sm">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg font-semibold">{formatDayOfWeek(day)}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {[0, 1].map((sessionIndex) => {
                    const sessions = form.getValues('sessions')
                    const daySessionsStart = sessions.findIndex((s) => s.dayOfWeek === day)
                    const formIndex = daySessionsStart + sessionIndex

                    const timeRange =
                      sessionIndex === 0
                        ? {
                          start: TIME_SLOT_SCHEDULE[day].START,
                          end: TIME_SLOT_SCHEDULE[day].PAUSE,
                        }
                        : {
                          start: TIME_SLOT_SCHEDULE[day].PAUSE,
                          end: TIME_SLOT_SCHEDULE[day].FINISH,
                        }

                    return (
                      <div key={sessionIndex} className="space-y-4">
                        <div className="flex items-center justify-center p-2 bg-blue-50 rounded-lg">
                          <span className="text-sm font-medium text-blue-700">
                            {timeRange.start} - {timeRange.end}
                          </span>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name={`sessions.${formIndex}.subject`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Matière</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={`h-9 ${fieldState.error ? 'border-red-500' : ''}`}
                                    >
                                      <SelectValue placeholder="Sélectionner" />
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
                            name={`sessions.${formIndex}.level`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Niveau</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value || undefined}
                                >
                                  <FormControl>
                                    <SelectTrigger
                                      className={`h-9 ${fieldState.error ? 'border-red-500' : ''}`}
                                    >
                                      <SelectValue placeholder="Sélectionner" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Object.values(LevelEnum).map((level) => (
                                      <SelectItem key={level} value={level}>
                                        {level}
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
                            name={`sessions.${formIndex}.timeSlot.classroomNumber`}
                            render={({ field, fieldState }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Salle</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    min="1"
                                    className={`h-9 ${fieldState.error ? 'border-red-500' : ''}`}
                                    {...field}
                                    value={field.value || ''}
                                    onChange={(e) =>
                                      field.onChange(
                                        e.target.value ? parseInt(e.target.value) : null,
                                      )
                                    }
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />
    </div>
  )
}

export default EditTeacherStep2
