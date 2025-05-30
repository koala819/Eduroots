'use client'

import { Eye, EyeOff, Lock, Mail, User } from 'lucide-react'
import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'

import Link from 'next/link'
import { useRouter } from 'next/navigation'

import { useToast } from '@/hooks/use-toast'

import { UserRoleEnum } from '@/types/user'

import { PWAButtonClient } from '@/components/atoms/client/PWAButton'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { loginAction } from '@/app/actions/auth'
import { FormSchema, FormValues } from '@/lib/validation/login-schema'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'

export const LoginClient = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [showPwd, setShowPwd] = useState<boolean>(false)
  const [loading, setLoading] = useState<boolean>(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      mail: '',
      pwd: '',
      role: undefined,
      userAgent: '',
    },
  })

  async function onSubmit(values: FormValues) {
    setLoading(true)

    const formData = new FormData()
    formData.append('email', values.mail)
    formData.append('pwd', values.pwd)
    formData.append('role', values.role as string)

    formData.append(
      'userAgent',
      typeof window !== 'undefined' ? navigator.userAgent : '',
    )

    try {
      const result = await loginAction(formData)

      if (!result?.success) {
        // Gérer les erreurs spécifiques
        if (result?.error === 'CredentialsSignin') {
          toast({
            variant: 'destructive',
            title: 'Erreur de connexion',
            description:
              result.message || 'Identifiants incorrects. Veuillez réessayer',
          })
          router.push('/unauthorized?error=CredentialsSignin')
          return
        }

        // Gérer les erreurs générales
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message || 'Une erreur est survenue',
        })
        return
      }

      // Gérer la redirection pour changement de mot de passe
      if (result.forcePasswordChange) {
        toast({
          variant: 'destructive',
          title: 'Mot de passe par défaut',
          description:
            result.message ||
            'Veuillez changer votre mot de passe pour des raisons de sécurité',
        })
        router.push(result.redirectUrl)
        return
      }

      // Connexion réussie
      if (result.status === 200) {
        // Attempting to sign in with next-auth...
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

        // Notification et redirection
        toast({
          variant: 'success',
          title: 'Connexion réussie',
          description: `Redirection vers ${getRoleName(values.role)}...`,
        })

        // Redirection en fonction du rôle
        const path = getRedirectUrl(values.role)
        // console.log('🚀  path:', path)

        // Attendre un court instant pour que la session soit complètement établie
        setTimeout(() => {
          router.push(path)

          // Si après un court délai nous sommes toujours sur la même page, forcer la redirection
          setTimeout(() => {
            if (window.location.pathname === '/') {
              console.log('Forcing navigation with window.location')
              window.location.href = path
            }
          }, 1000)
        }, 300)
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

  // Fonction utilitaire pour obtenir le nom du rôle pour le message toast
  function getRoleName(role: UserRoleEnum) {
    switch (role) {
      case UserRoleEnum.Admin:
      case UserRoleEnum.Bureau:
        return 'Bureau'
      case UserRoleEnum.Teacher:
        return 'Enseignant'
      case UserRoleEnum.Student:
        return 'Parent'
      default:
        return 'Accueil'
    }
  }

  // Fonction utilitaire pour obtenir l'URL de redirection
  function getRedirectUrl(role: UserRoleEnum) {
    switch (role) {
      case UserRoleEnum.Admin:
      case UserRoleEnum.Bureau:
        return '/admin'
      case UserRoleEnum.Teacher:
        return '/teacher'
      case UserRoleEnum.Student:
        return '/family'
      default:
        return '/home'
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="hidden md:flex min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4 items-center justify-center"
    >
      <div className="w-full max-w-sm">
        {/* Logo Area */}
        <div className="mb-8 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
            <User className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Bienvenue
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Connectez-vous à votre compte
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-xl space-y-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <input type="hidden" {...form.register('userAgent')} />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Je suis
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-xl h-12">
                          <SelectValue placeholder="Choisir un rôle" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={UserRoleEnum.Admin}>
                          <div className="flex items-center">
                            <User className="mr-2" />
                            Direction
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRoleEnum.Teacher}>
                          <div className="flex items-center">
                            <User className="mr-2" />
                            Enseignant(e)
                          </div>
                        </SelectItem>
                        <SelectItem value={UserRoleEnum.Student}>
                          <div className="flex items-center">
                            <User className="mr-2" />
                            Parent
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="mail"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Email
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          placeholder="nom@email.com"
                          className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-xl pl-12 h-12"
                        />
                        <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="pwd"
                render={({ field }) => (
                  <FormItem className="space-y-2">
                    <FormLabel className="block text-sm font-medium text-gray-700 dark:text-gray-200">
                      Mot de passe
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          {...field}
                          type={showPwd ? 'text' : 'password'}
                          placeholder="••••••••"
                          className="w-full bg-gray-50 dark:bg-gray-700 border-0 rounded-xl pl-12 pr-12 h-12"
                        />
                        <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                        <button
                          type="button"
                          onClick={() => setShowPwd(!showPwd)}
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400"
                        >
                          {showPwd ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="text-right">
                <Link
                  href="/rstPwd"
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl h-12 font-medium"
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Connexion...
                    </span>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </motion.div>
            </form>
          </Form>
        </div>

        {/* PWA Button */}
        <div className="mt-6 text-center">
          <PWAButtonClient />
        </div>
      </div>
    </motion.div>
  )
}
