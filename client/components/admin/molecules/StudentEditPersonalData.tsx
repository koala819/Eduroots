'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import * as z from 'zod'

import { Button } from '@/client/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/client/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { Label } from '@/client/components/ui/label'
import { LoadingSpinner } from '@/client/components/ui/loading-spinner'
import { RadioGroup, RadioGroupItem } from '@/client/components/ui/radio-group'
import { useToast } from '@/client/hooks/use-toast'
import { updateStudentAdminAction } from '@/server/actions/admin/update-student-admin'
import { StudentResponse } from '@/types/student-payload'
import { GenderEnum } from '@/types/user'

const personalDataSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  parentEmail1: z.string().email('Email invalide').optional().default('user@mail.fr'),
  parentEmail2: z.string().email('Email invalide').optional().or(z.literal('')),
  gender: z.nativeEnum(GenderEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un genre' }),
  }),
  dateOfBirth: z.string().optional(),
})

type AdminFormData = z.infer<typeof personalDataSchema>

interface EditPersonalDataProps {
  studentData: StudentResponse
}

export const EditPersonalData = ({ studentData }: EditPersonalDataProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Initialiser le formulaire avec des valeurs par défaut pour éviter les inputs non contrôlés
  const defaultValues = {
    firstname: studentData.firstname || '',
    lastname: studentData.lastname || '',
    parentEmail1: studentData.email || '',
    parentEmail2: studentData.secondary_email || '',
    gender: (studentData.gender as GenderEnum) || GenderEnum.Masculin,
    dateOfBirth: studentData.date_of_birth
      ? new Date(studentData.date_of_birth).toISOString().split('T')[0]
      : '',
  }

  const form = useForm<AdminFormData>({
    resolver: zodResolver(personalDataSchema),
    defaultValues,
  })

  useEffect(() => {
    // Mettre à jour le formulaire si les données changent
    const formattedDate = studentData.date_of_birth
      ? new Date(studentData.date_of_birth).toISOString().split('T')[0]
      : ''

    form.reset({
      firstname: studentData.firstname || '',
      lastname: studentData.lastname || '',
      parentEmail1: studentData.email || '',
      parentEmail2: studentData.secondary_email || '',
      gender: (studentData.gender as GenderEnum) || GenderEnum.Masculin,
      dateOfBirth: formattedDate,
    })
  }, [studentData, form])

  const handleSubmit = async (data: AdminFormData) => {
    setIsSubmitting(true)

    try {
      const result = await updateStudentAdminAction({
        studentId: studentData.id,
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.parentEmail1,
        secondaryEmail: data.parentEmail2,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
      })

      if (result.success) {
        toast({
          title: 'Succès',
          description: result.message || 'Informations mises à jour',
          variant: 'success',
        })
        router.push(`/admin/members/student/edit/${studentData.id}`)
      } else {
        toast({
          title: 'Erreur',
          description: result.message || 'Erreur lors de la mise à jour',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error)
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour des informations',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
    return <LoadingSpinner text="Mise à jour en cours..." />
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      <Card>
        <CardHeader>
          <CardTitle>Modifier les Informations Administratives</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Prénom" autoComplete="given-name" />
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
                        <Input {...field} placeholder="Nom" autoComplete="family-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Genre</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex items-center gap-6"
                      >
                        {Object.entries(GenderEnum).map(([label, value]) => (
                          <div key={value} className="flex items-center space-x-2">
                            <RadioGroupItem value={value} id={value} />
                            <Label htmlFor={value}>{label}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date de naissance</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="date"
                        value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentEmail1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Parent 1</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@mail.fr"
                        autoComplete="email"
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
                    <FormLabel>Email Parent 2</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        placeholder="user@mail.fr"
                        autoComplete="email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="col-span-1 md:col-span-2 flex gap-4 justify-end">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push(`/admin/members/student/edit/${studentData.id}`)}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
