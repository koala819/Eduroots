'use client'

import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { Card, CardContent } from '@/client/components/ui/card'
import { Checkbox } from '@/client/components/ui/checkbox'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'
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

const daysDisplay = {
  [TimeSlotEnum.SATURDAY_MORNING]: 'Samedi Matin',
  [TimeSlotEnum.SATURDAY_AFTERNOON]: 'Samedi Après-midi',
  [TimeSlotEnum.SUNDAY_MORNING]: 'Dimanche Matin',
}

interface SubjectSelectProps {
  form: UseFormReturn<TeacherFormData>
  formIndex: number
}

const SubjectSelect = ({ form, formIndex }: SubjectSelectProps) => (
  <FormField
    control={form.control}
    name={`sessions.${formIndex}.subject`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm">Matière</FormLabel>
        <Select onValueChange={field.onChange}>
          <FormControl>
            <SelectTrigger className="h-9">
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
)

interface LevelSelectProps {
  form: UseFormReturn<TeacherFormData>
  formIndex: number
}

const LevelSelect = ({ form, formIndex }: LevelSelectProps) => (
  <FormField
    control={form.control}
    name={`sessions.${formIndex}.level`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm">Niveau</FormLabel>
        <Select onValueChange={field.onChange}>
          <FormControl>
            <SelectTrigger className="h-9">
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
)

interface TimeSlotSelectProps {
  form: UseFormReturn<TeacherFormData>
  formIndex: number
}

const TimeSlotSelect = ({ form, formIndex }: TimeSlotSelectProps) => (
  <FormField
    control={form.control}
    name={`sessions.${formIndex}.dayOfWeek`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm">Créneau horaire</FormLabel>
        <Select onValueChange={field.onChange}>
          <FormControl>
            <SelectTrigger className="h-9">
              <SelectValue placeholder="Sélectionner" />
            </SelectTrigger>
          </FormControl>
          <SelectContent>
            {Object.values(TimeSlotEnum).map((timeSlot) => (
              <SelectItem key={timeSlot} value={timeSlot}>
                {timeSlot}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <FormMessage />
      </FormItem>
    )}
  />
)

interface ClassroomNumberInputProps {
  form: UseFormReturn<TeacherFormData>
  formIndex: number
}

const ClassroomNumberInput = ({ form, formIndex }: ClassroomNumberInputProps) => (
  <FormField
    control={form.control}
    name={`sessions.${formIndex}.timeSlot.classroomNumber`}
    render={({ field }) => (
      <FormItem>
        <FormLabel className="text-sm">Salle</FormLabel>
        <FormControl>
          <Input
            type="number"
            min="1"
            className="h-9"
            {...field}
            value={field.value ?? ''}
            onChange={(e) =>
              field.onChange(e.target.value ? parseInt(e.target.value) : '')
            }
          />
        </FormControl>
        <FormMessage />
      </FormItem>
    )}
  />
)

const StepTwo = ({ form }: StepTwoProps) => {
  const [selectedDays, setSelectedDays] = useState<TimeSlotEnum[]>([])

  const handleDayChange = (day: TimeSlotEnum, checked: boolean) => {
    let updatedDays: TimeSlotEnum[]
    if (checked) {
      updatedDays = [...selectedDays, day]
    } else {
      updatedDays = selectedDays.filter((d) => d !== day)
    }
    setSelectedDays(updatedDays)

    // Mise à jour du formulaire
    const newSessions = updatedDays.flatMap((selectedDay) => {
      const daySchedule = TIME_SLOT_SCHEDULE[selectedDay]
      return [
        {
          dayOfWeek: selectedDay,
          timeSlot: {
            startTime: daySchedule.START,
            endTime: daySchedule.PAUSE,
            classroomNumber: null,
          },
          subject: null,
          level: null,
        },
        {
          dayOfWeek: selectedDay,
          timeSlot: {
            startTime: daySchedule.PAUSE,
            endTime: daySchedule.FINISH,
            classroomNumber: null,
          },
          subject: null,
          level: null,
        },
      ]
    })

    form.setValue('sessions', newSessions)
  }

  return (
    <div className="space-y-6">
      {/* Section sélection des jours - Mobile First */}
      <div className="space-y-4">
        <Label className="text-base font-semibold block mb-4">Jours d&apos;enseignement</Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(daysDisplay).map(([day, label]) => (
            <div
              key={day}
              className="flex items-center space-x-3 p-3
              bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <Checkbox
                // checked={selectedDays.includes(day as TimeSlotEnum)}
                onCheckedChange={(checked) =>
                  handleDayChange(day as TimeSlotEnum, checked as boolean)
                }
                className="h-5 w-5"
              />
              <Label className="text-sm font-medium">{label}</Label>
            </div>
          ))}
        </div>
      </div>

      <FormField
        control={form.control}
        name="sessions"
        render={({ field }) => (
          <div className="space-y-4">
            {field.value.map((_, formIndex) => (
              <Card key={formIndex}>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Grille des champs responsive */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <SubjectSelect form={form} formIndex={formIndex} />
                      <LevelSelect form={form} formIndex={formIndex} />
                      <TimeSlotSelect form={form} formIndex={formIndex} />
                      <ClassroomNumberInput form={form} formIndex={formIndex} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      />
    </div>
  )
}

export default StepTwo
