import { UseFormReturn } from 'react-hook-form'

import { TeacherFormData } from '@/client/components/root/EditTeacherForm'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'

interface EditTeacherStep1Props {
  form: UseFormReturn<TeacherFormData>
}

const EditTeacherStep1 = ({ form }: EditTeacherStep1Props) => {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstname"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prénom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Prénom" />
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
              <FormLabel>Nom</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Nom" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input {...field} type="email" placeholder="email@example.com" />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}

export default EditTeacherStep1
