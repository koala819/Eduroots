'use client'

import {ArrowRight, CircleArrowLeft, Eye, EyeOff, Lock, Mail, User} from 'lucide-react'
import {signIn} from 'next-auth/react'
import {useState} from 'react'
import {useForm} from 'react-hook-form'

import Link from 'next/link'
import {useRouter} from 'next/navigation'

import {useToast} from '@/hooks/use-toast'

import {UserRoleEnum} from '@/types/user'

import {PWAButtonClient} from '@/components/atoms/client/PWAButton'
import {Button} from '@/components/ui/button'
import {Form, FormControl, FormField, FormItem, FormMessage} from '@/components/ui/form'
import {Input} from '@/components/ui/input'

import {loginAction} from '@/app/actions/auth'
import {FormSchema, FormValues} from '@/lib/validation/login-schema'
import {zodResolver} from '@hookform/resolvers/zod'
import {motion} from 'framer-motion'

export const LoginMobileClient = () => {
  const {toast} = useToast()
  const router = useRouter()

  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState(1)
  const [showPwd, setShowPwd] = useState(false)

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

    // Ajout sécurisé de userAgent
    // Move this code out of the render cycle to avoid hydration mismatches
    formData.append('userAgent', typeof window !== 'undefined' ? navigator.userAgent : '')

    try {
      // Update userAgent before submission
      // values.userAgent = userAgent

      // // Create FormData for the server action
      // const formData = new FormData()
      // Object.entries(values).forEach(([key, value]) => {
      //   if (value !== undefined) {
      //     formData.append(key, value.toString())
      //   }
      // })

      // Importation dynamique de l'action côté client pour éviter les problèmes d'hydratation
      // const { loginAction } = await import('@/app/actions/auth')
      const result = await loginAction(formData)

      if (!result?.success) {
        // Gérer les erreurs spécifiques
        if (result?.error === 'CredentialsSignin') {
          toast({
            variant: 'destructive',
            title: 'Erreur de connexion',
            description: result.message || 'Identifiants incorrects. Veuillez réessayer',
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
            result.message || 'Veuillez changer votre mot de passe pour des raisons de sécurité',
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

  function handleNext(nextStep: number) {
    const currentFields: Record<number, keyof FormValues> = {
      1: 'role',
      2: 'mail',
      3: 'pwd',
    }

    form.trigger(currentFields[step]).then((isValid) => {
      if (isValid) setStep(nextStep)
    })
  }

  return (
    <motion.div
      initial={{opacity: 0, scale: 0.95}}
      animate={{opacity: 1, scale: 1}}
      transition={{duration: 0.3}}
      className="md:hidden min-h-screen bg-gray-50 dark:bg-gray-900 p-4 flex items-center justify-center"
    >
      <div className="w-full max-w-sm">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  s === step
                    ? 'bg-blue-600 text-white'
                    : s < step
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                }`}
              >
                {s}
              </div>
            ))}
          </div>
          <div className="h-1 bg-gray-200 dark:bg-gray-700 rounded-full">
            <div
              className="h-1 bg-blue-600 rounded-full transition-all duration-300"
              style={{width: `${((step - 1) / 2) * 100}%`}}
            />
          </div>
        </div>

        {/* Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Step 1 - Role Selection */}
              {step === 1 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Qui êtes-vous ?
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Sélectionnez votre rôle
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="role"
                    render={({field}) => (
                      <FormItem className="space-y-4">
                        {[
                          {label: 'Direction', value: UserRoleEnum.Admin},
                          {
                            label: 'Enseignant(e)',
                            value: UserRoleEnum.Teacher,
                          },
                          {label: 'Parent', value: UserRoleEnum.Student},
                        ].map((role) => (
                          <button
                            key={role.value}
                            type="button"
                            className={`w-full p-4 bg-gray-50 dark:bg-gray-700 rounded-xl flex items-center justify-between hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors ${
                              field.value === role.value ? 'ring-2 ring-blue-600' : ''
                            }`}
                            onClick={() => {
                              field.onChange(role.value)
                              handleNext(2)
                            }}
                          >
                            <span className="flex items-center">
                              <User className="w-5 h-5 mr-3 text-blue-600" />
                              <span className="text-gray-900 dark:text-white">{role.label}</span>
                            </span>
                            <ArrowRight className="w-5 h-5 text-gray-400" />
                          </button>
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}

              {/* Step 2 - Email */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Votre email
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Entrez votre adresse email
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="mail"
                    render={({field}) => (
                      <FormItem>
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

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={() => setStep(1)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl h-12"
                    >
                      <CircleArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    <Button
                      type="button"
                      onClick={() => handleNext(3)}
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12"
                    >
                      Suivant
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3 - Password */}
              {step === 3 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                      Mot de passe
                    </h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Entrez votre mot de passe
                    </p>
                  </div>

                  <FormField
                    control={form.control}
                    name="pwd"
                    render={({field}) => (
                      <FormItem>
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

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={() => setStep(2)}
                      className="flex-1 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white rounded-xl h-12"
                    >
                      <CircleArrowLeft className="mr-2 h-4 w-4" />
                      Retour
                    </Button>
                    <Button
                      type="submit"
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl h-12"
                      disabled={loading}
                    >
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </div>
                </div>
              )}
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
