'use client'

import { Save } from 'lucide-react'
import { createClient } from '@/client/utils/supabase'
import { useForm } from 'react-hook-form'
import React from 'react'

import { Period, PeriodTypeEnum } from '@/types/schedule'
import { TimeSlotEnum } from '@/types/courses'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader } from '@/client/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/client/components/ui/select'

import { useSchedules } from '@/client/context/schedules'
import { formatDayOfWeek } from '@/server/utils/helpers'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const periodSchema = z.object({
  startTime: z
    .string()
    .regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide')
    .refine((time) => {
      const [hours, minutes] = time.split(':').map(Number)
      return hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59
    }, 'L\'heure doit être valide'),
  endTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Format d\'heure invalide'),
  type: z.enum([PeriodTypeEnum.CLASS, PeriodTypeEnum.BREAK]),
  order: z.number(),
})

const dayScheduleSchema = z.object({
  periods: z.array(periodSchema),
})

const scheduleFormSchema = z.record(z.string(), dayScheduleSchema).superRefine((data, ctx) => {
  Object.entries(data).forEach(([timeSlot, daySchedule]) => {
    daySchedule.periods.forEach((period, index) => {
      if (index > 0) {
        const prevPeriod = daySchedule.periods[index - 1]
        // On change la condition pour autoriser l'égalité
        if (period.startTime < prevPeriod.endTime) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message:
              'L\'heure de début doit être égale ou après l\'heure de fin de la période précédente',
            path: [timeSlot, 'periods', index, 'startTime'],
          })
        }
      }
      // Ajout d'une validation pour s'assurer que l'heure de fin est après l'heure de début
      if (period.endTime <= period.startTime) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'L\'heure de fin doit être après l\'heure de début',
          path: [timeSlot, 'periods', index, 'endTime'],
        })
      }
    })
  })
})

type ScheduleFormValues = z.infer<typeof scheduleFormSchema>

export const ScheduleEditor = () => {
  const { schedules, saveSchedules, isLoading, error } = useSchedules()
  const supabase = createClient()
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUserId(user?.id ?? null)
    }
    getUser()
  }, [supabase])

  const form = useForm<ScheduleFormValues>({
    resolver: zodResolver(scheduleFormSchema),
    defaultValues: schedules,
    values: schedules,
    mode: 'onChange',
  })

  const onSubmit = (data: ScheduleFormValues) => {
    if (!userId) return
    const scheduleData = {
      ...data,
      updatedBy: userId,
    }

    saveSchedules(scheduleData)
  }

  if (isLoading) return <div>Chargement des horaires...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div className="px-4 sm:px-6 py-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-semibold">Configuration des horaires</h1>
          </div>

          {Object.entries(schedules).map(([timeSlot, periodData]) => (
            <Card key={timeSlot} className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <h2 className="text-lg font-medium">{formatDayOfWeek(timeSlot as TimeSlotEnum)}</h2>
              </CardHeader>
              <CardContent className="py-3 space-y-4">
                {periodData.periods?.map((period: Period, idx) => (
                  <div key={idx} className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name={`${timeSlot}.periods.${idx}.startTime`}
                      defaultValue={period.startTime}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input className="w-full" type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`${timeSlot}.periods.${idx}.endTime`}
                      defaultValue={period.endTime}
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Input className="w-full" type="time" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name={`${timeSlot}.periods.${idx}.type`}
                      defaultValue={period.type}
                      render={({ field }) => (
                        <FormItem>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={PeriodTypeEnum.CLASS}>Cours</SelectItem>
                              <SelectItem value={PeriodTypeEnum.BREAK}>Pause</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          <Button type="submit" className="w-full sm:w-auto flex items-center justify-center gap-2">
            <Save className="w-4 h-4" />
            <span>Enregistrer</span>
          </Button>
        </form>
      </Form>
    </div>
  )
}
