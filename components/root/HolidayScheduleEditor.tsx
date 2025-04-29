'use client'

import {Save} from 'lucide-react'
import {useSession} from 'next-auth/react'
import {useForm} from 'react-hook-form'

import {useRouter} from 'next/navigation'

import {Button} from '@/components/ui/button'
import {Card, CardContent, CardHeader} from '@/components/ui/card'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from '@/components/ui/select'

import {useHolidays} from '@/context/Holidays/client'
import {zodResolver} from '@hookform/resolvers/zod'
import {z} from 'zod'

const holidaySchema = z
  .object({
    name: z.string().min(1, 'Le nom est requis'),
    start: z.string().min(1, 'La date de début est requise'),
    end: z.string().min(1, 'La date de fin est requise'),
    type: z.enum(['REGULAR', 'SPECIAL']),
  })
  .refine(
    (data) => {
      return new Date(data.end) >= new Date(data.start)
    },
    {
      message: 'La date de fin doit être après la date de début',
      path: ['end'],
    },
  )

const holidayFormSchema = z.object({
  holidays: z.array(holidaySchema),
})

type HolidayFormValues = z.infer<typeof holidayFormSchema>

export const HolidayScheduleEditor = () => {
  const {holidays, saveHolidays, isLoading, error} = useHolidays()
  const router = useRouter()
  const {data: session} = useSession()

  // Fonction pour formater les dates
  const formatDateForInput = (dateString: Date) => {
    const date = new Date(dateString)
    return date.toISOString().split('T')[0]
  }

  // Formatter les données pour le formulaire
  const formattedHolidays = holidays.map((holiday) => {
    return {
      ...holiday,
      start: formatDateForInput(holiday.start),
      end: formatDateForInput(holiday.end),
    }
  })

  const form = useForm<HolidayFormValues>({
    resolver: zodResolver(holidayFormSchema),
    defaultValues: {
      holidays: formattedHolidays,
    },
    values: {holidays: formattedHolidays},
    mode: 'onChange',
  })

  const onSubmit = (data: HolidayFormValues) => {
    if (!session?.user?.id) return
    const formattedData = {
      holidays: data.holidays.map((holiday) => ({
        ...holiday,
        start: new Date(holiday.start),
        end: new Date(holiday.end),
      })),
      updatedBy: session.user.id,
    }

    saveHolidays(formattedData)
  }

  if (isLoading) return <div>Chargement des vacances...</div>
  if (error) return <div>Erreur: {error}</div>

  return (
    <div className="px-4 sm:px-6 py-4">
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full max-w-4xl mx-auto space-y-4 sm:space-y-6"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 sm:gap-0">
            <h1 className="text-xl sm:text-2xl font-semibold">Configuration des vacances</h1>
          </div>

          {holidays.map((holiday, idx) => (
            <Card key={idx} className="shadow-sm">
              <CardHeader className="py-3 px-4">
                <FormField
                  control={form.control}
                  name={`holidays.${idx}.name`}
                  defaultValue={holiday.name}
                  render={({field}) => (
                    <FormItem>
                      <FormControl>
                        <Input className="w-full" placeholder="Nom de la période" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardHeader>
              <CardContent className="py-3 px-4 flex flex-col sm:grid sm:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name={`holidays.${idx}.start`}
                  defaultValue={formatDateForInput(holiday.start)}
                  render={({field}) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input type="date" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`holidays.${idx}.end`}
                  defaultValue={formatDateForInput(holiday.end)}
                  render={({field}) => (
                    <FormItem className="w-full">
                      <FormControl>
                        <Input type="date" className="w-full" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={`holidays.${idx}.type`}
                  defaultValue={holiday.type}
                  render={({field}) => (
                    <FormItem>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="REGULAR">Vacances</SelectItem>
                          <SelectItem value="SPECIAL">Jour spécial</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
