'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
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
import { createStudent } from '@/server/actions/api/students'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

const createStudentSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  parentEmail1: z
    .string()
    .min(1, 'L\'email du parent 1 est requis')
    .email('Email invalide'),
  parentEmail2: z
    .string()
    .email('Email invalide')
    .optional()
    .or(z.literal('')),
  gender: z.nativeEnum(GenderEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un genre' }),
  }),
  dateOfBirth: z.string().optional(),
  phone: z.string().optional(),
})

type CreateStudentFormData = z.infer<typeof createStudentSchema>

const CreateStudentForm = () => {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  const form = useForm<CreateStudentFormData>({
    resolver: zodResolver(createStudentSchema),
    defaultValues: {
      firstname: '',
      lastname: '',
      parentEmail1: '',
      parentEmail2: '',
      gender: GenderEnum.Masculin,
      dateOfBirth: '',
      phone: '',
    },
  })

  const handleSubmit = async (data: CreateStudentFormData) => {
    setIsSubmitting(true)

    try {
      const studentData = {
        email: data.parentEmail1,
        firstname: data.firstname,
        lastname: data.lastname.toUpperCase(),
        role: UserRoleEnum.Student,
        type: UserType.Both,
        gender: data.gender,
        secondary_email: data.parentEmail2 || null,
        phone: data.phone ?? null,
        school_year: '2024-2025',
        subjects: [], // Pas de cours pour l'instant
        has_invalid_email: data.parentEmail1 === 'user@mail.fr',
        date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        is_active: true,
        deleted_at: null,
        stats_model: null,
        student_stats_id: null,
        teacher_stats_id: null,
      }

      const response = await createStudent(studentData)

      if (response.success && response.data) {
        toast({
          title: 'Succès',
          variant: 'success',
          description: 'L\'étudiant a été créé avec succès',
        })
        router.push(`/admin/members/student/edit/${response.data.id}`)
      } else {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: response.message || 'Une erreur est survenue',
        })
      }
    } catch (error: any) {
      console.error('Student creation error:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error.message ?? 'Une erreur est survenue',
      })
      setIsSubmitting(false)
    }
  }

  if (isSubmitting) {
    return <LoadingSpinner text="Création en cours..." />
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
          Nouvel Étudiant
        </h1>
        <p className="text-muted-foreground">
          Créez un nouvel étudiant avec ses informations personnelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
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

              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Genre *</FormLabel>
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
                        onChange={(e) => field.onChange(e.target.value)}
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

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone (optionnel)</FormLabel>
                    <FormControl>
                      <Input
                        type="tel"
                        placeholder="06 12 34 56 78"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-4 justify-end pt-6 border-t border-border">
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => router.push('/admin/members')}
                  disabled={isSubmitting}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Création...' : 'Créer l\'étudiant'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

export default CreateStudentForm
