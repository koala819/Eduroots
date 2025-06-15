'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'

import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'

import { GenderEnum } from '@/types/mongo/user'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { LoadingSpinner } from '@/components/ui/loading-spinner'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { useStudents } from '@/context/Students/client'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'

const adminSchema = z.object({
  firstname: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  lastname: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  parentEmail1: z.string().email('Email invalide').optional().default('user@mail.fr'),
  parentEmail2: z.string().email('Email invalide').optional().or(z.literal('')),
  gender: z.nativeEnum(GenderEnum, {
    errorMap: () => ({ message: 'Veuillez sélectionner un genre' }),
  }),
  dateOfBirth: z.string().optional(),
})

type AdminFormData = z.infer<typeof adminSchema>

export const EditAdminStudent = ({ id }: {id: string}) => {
  const [isLoading, setIsLoading] = useState(true)
  const { getOneStudent, updateStudent } = useStudents()
  const { toast } = useToast()
  const router = useRouter()

  const form = useForm<AdminFormData>({
    resolver: zodResolver(adminSchema),
  })

  useEffect(() => {
    const loadData = async () => {
      try {
        const student = await getOneStudent(id)
        if (student) {
          form.reset({
            firstname: student.firstname,
            lastname: student.lastname,
            parentEmail1: student.email,
            parentEmail2: student.secondaryEmail || '',
            gender: student.gender,
            dateOfBirth: student.dateOfBirth || '',
          })
        }
      } catch (error) {
        console.error(error)
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données de l\'étudiant',
          variant: 'destructive',
        })
      } finally {
        setIsLoading(false)
      }
    }
    loadData()
  }, [id])

  const handleSubmit = async (data: AdminFormData) => {
    try {
      const studentData = {
        firstname: data.firstname,
        lastname: data.lastname,
        email: data.parentEmail1,
        secondaryEmail: data.parentEmail2,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth,
      }
      await updateStudent(id, studentData)
      toast({
        title: 'Succès',
        description: 'Informations mises à jour',
        variant: 'success',
      })
      router.push(`/admin/root/student/edit/${id}`)
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la mise à jour',
        variant: 'destructive',
      })
    }
  }

  if (isLoading) return <LoadingSpinner text="Chargement..." />

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
                  onClick={() => router.push(`/admin/root/student/edit/${id}`)}
                >
                  Annuler
                </Button>
                <Button type="submit">Enregistrer</Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}
