'use client'

import { getSession, signIn } from 'next-auth/react'
import { useState } from 'react'

import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'
import { useThemeLoader } from '@/hooks/useThemeLoader'

import { UserRoleEnum } from '@/types/user'

import { z } from 'zod'

export const FormSchema = z.object({
  mail: z.string().email("Le format de l'email est invalide"),
  pwd: z.string().min(8, {
    message: 'Le mot de passe doit contenir 8 caractères minimum.',
  }),
  role: z.nativeEnum(UserRoleEnum, {
    errorMap: () => ({ message: 'Veuillez faire un choix svp.' }),
  }),
})

export type FormValues = z.infer<typeof FormSchema>

export function useLogin() {
  const { loadTheme } = useThemeLoader()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function checkDefaultPassword(
    email: string,
    password: string,
    role: UserRoleEnum,
  ) {
    const response = await fetch('/api/checkDefaultPwd', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, role }),
    })
    return response.json()
  }

  async function onSubmit(values: FormValues) {
    // console.log('🚀 ~ onSubmit ~ values:', values)
    setLoading(true)
    try {
      // Log de la tentative de connexion
      await fetch('/api/log/connection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user: {
            email: values.mail,
            role: values.role,
          },
          isSuccessful: false,
          userAgent: navigator.userAgent,
        }),
      })

      // Tentative de connexion
      const result = await signIn('credentials', {
        redirect: false,
        email: values.mail,
        password: values.pwd,
        role: values.role,
      })

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: result.error,
        })
        router.push('/unauthorized?error=CredentialsSignin')
        return
      }

      // Récupération de la session
      const session = await getSession()
      const user = session?.user

      // Mise à jour du log de connexion
      if (user) {
        await fetch('/api/log/update', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user: {
              _id: user._id,
              email: user.email,
              firstname: user.firstname,
              lastname: user.lastname,
              role: user.role,
            },
            isSuccessful: true,
            userAgent: navigator.userAgent,
          }),
        })
      }

      // Chargement du thème
      await loadTheme(user?.role || UserRoleEnum.Teacher)

      // Gestion de la redirection selon le rôle
      switch (user?.role) {
        case UserRoleEnum.Admin:
        case UserRoleEnum.Bureau:
          toast({
            variant: 'success',
            title: 'Connexion réussie',
            description: 'Redirection vers Bureau...',
          })
          router.push('/admin')
          break

        case UserRoleEnum.Teacher:
          // Vérification du mot de passe par défaut
          const authResult = await checkDefaultPassword(
            values.mail,
            values.pwd,
            values.role,
          )

          if (!authResult.isMatch) {
            toast({
              variant: 'destructive',
              title: 'Identifiants incorrects. Veuillez réessayer',
            })
            break
          }

          if (authResult.isDefault) {
            toast({
              variant: 'destructive',
              title:
                'Veuillez changer votre mot de passe pour des raisons de sécurité',
            })
            router.push('/rstPwd?forceChange=true')
            break
          }

          toast({
            variant: 'success',
            title: 'Connexion réussie',
            description: 'Redirection vers Enseignant...',
          })
          router.push('/teacher')
          break

        case UserRoleEnum.Student:
          toast({
            variant: 'success',
            title: 'Connexion réussie',
            description: 'Redirection vers Parent...',
          })
          router.push('/student')
          break

        default:
          toast({
            variant: 'success',
            title: 'Connexion réussie',
            description: 'Redirection vers Accueil...',
          })
          router.push('/home')
      }
    } catch (error) {
      console.error('Error during login:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la connexion',
      })
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    onSubmit,
    FormSchema,
  }
}
