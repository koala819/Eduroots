'use client'

import { Paperclip } from 'lucide-react'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/client/components/ui/form'

export const MessageAttachmentUploader = ({ form }: {form: any}) => {
  return (
    <FormField
      control={form.control}
      name="attachment"
      render={({ field: { onChange, value, ...field } }) => (
        <FormItem>
          <FormLabel htmlFor="attachment">Pièce jointe</FormLabel>
          <FormControl>
            <div className="mt-1 flex justify-center rounded-md border-2 border-dashed border-gray-300 px-4 sm:px-6 py-4 sm:py-6 dark:border-gray-700">
              <div className="space-y-2 sm:space-y-4 text-center">
                <Paperclip className="mx-auto h-8 w-8 sm:h-12 sm:w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600 dark:text-gray-400">
                  <input
                    id="attachment"
                    type="file"
                    onChange={(e) => onChange(e.target.files?.[0])}
                    {...field}
                    className="w-full"
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  PNG, JPG, GIF jusqu&apos;à 10Mo
                </p>
              </div>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
