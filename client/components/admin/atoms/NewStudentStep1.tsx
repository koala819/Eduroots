'use client'

import { format } from 'date-fns'
import { fr } from 'date-fns/locale'
import { CalendarIcon, Mail, User } from 'lucide-react'
import { useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { BiFemale, BiMale } from 'react-icons/bi'

import { FormData } from '@/client/components/organisms/NewStudentForm'
import { Button } from '@/client/components/ui/button'
import { Calendar } from '@/client/components/ui/calendar'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/client/components/ui/popover'
import { RadioGroup, RadioGroupItem } from '@/client/components/ui/radio-group'
import { cn } from '@/server/utils/helpers'
import { GenderEnum } from '@/types/user'

interface StepOneProps {
  form: UseFormReturn<FormData>
}

export function StepOne({ form }: StepOneProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false)

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      form.setValue('dateOfBirth', date.toISOString().split('T')[0])
    }
    setIsCalendarOpen(false)
  }

  // Helper function pour gérer la date de manière sûre
  const getSelectedDate = () => {
    const dateValue = form.watch('dateOfBirth')
    return dateValue ? new Date(dateValue) : undefined
  }

  const formatSelectedDate = () => {
    const date = getSelectedDate()
    return date ? format(date, 'dd MMMM yyyy', { locale: fr }) : 'Sélectionner une date'
  }

  return (
    <div className="space-y-6">
      {/* Informations personnelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="w-5 h-5 text-primary" />
            Informations personnelles
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Prénom et Nom */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Prénom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Prénom de l'étudiant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastname"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nom *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nom de l'étudiant" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Genre */}
          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem className="space-y-3">
                <FormLabel>Genre *</FormLabel>
                <FormControl>
                  <RadioGroup
                    onValueChange={field.onChange}
                    value={field.value || ''}
                    className="flex flex-col space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={GenderEnum.Masculin} id="male" />
                      <Label htmlFor="male" className="flex items-center gap-2 cursor-pointer">
                        <BiMale className="w-4 h-4 text-blue-500" />
                        Masculin
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value={GenderEnum.Feminin} id="female" />
                      <Label htmlFor="female" className="flex items-center gap-2 cursor-pointer">
                        <BiFemale className="w-4 h-4 text-pink-500" />
                        Féminin
                      </Label>
                    </div>
                  </RadioGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Date de naissance */}
          <FormField
            control={form.control}
            name="dateOfBirth"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Date de naissance *</FormLabel>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          'w-full pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formatSelectedDate()}
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={getSelectedDate()}
                      onSelect={handleDateSelect}
                      disabled={(date) => {
                        const today = new Date()
                        const minDate = new Date('1900-01-01')
                        return date > today || date < minDate
                      }}
                      initialFocus
                      locale={fr}
                      captionLayout="dropdown-buttons"
                      fromYear={1900}
                      toYear={new Date().getFullYear()}
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Informations de contact */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Mail className="w-5 h-5 text-primary" />
            Informations de contact
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="parentEmail1"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email du parent 1 *</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="parent1@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="parentEmail2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email du parent 2 (optionnel)</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="parent2@example.com"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>
    </div>
  )
}
