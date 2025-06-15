'use client'

import { UseFormReturn } from 'react-hook-form'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

type MessageFormFields = {
  subject: string
  message: string
  attachment?: any
}

type SubjectFieldProps = {
  form: UseFormReturn<MessageFormFields>
}

export const SubjectField = ({ form }: SubjectFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="subject"
      render={({ field }) => (
        <FormItem className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-4">
          <FormLabel className="w-full sm:w-auto">Sujet:</FormLabel>
          <FormControl className="w-full">
            <Input placeholder="Saisir le sujet du message" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
