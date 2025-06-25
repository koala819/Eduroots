'use client'

import {
  AcademicCapIcon,
  BuildingOfficeIcon,
  HomeIcon,
} from '@heroicons/react/24/outline'
import {
  EyeIcon,
  EyeSlashIcon,
  UserGroupIcon,
} from '@heroicons/react/24/solid'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { PWAButtonClient } from '@/client/components/atoms/PWAButton'
import { Button } from '@/client/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/client/components/ui/form'
import { Input } from '@/client/components/ui/input'
import { useToast } from '@/client/hooks/use-toast'
import { createClient } from '@/client/utils/supabase'
import { loginAction } from '@/server/actions/auth'

const formSchema = z.object({
  role: z.string({
    required_error: 'Veuillez sélectionner votre profil',
  }),
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})

type FormValues = z.infer<typeof formSchema>;

export const LoginClient = () => {
  const { toast } = useToast()
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      role: '',
      email: '',
      password: '',
    },
  })

  async function signInWithGoogle() {
    const role = form.getValues('role')
    if (!role) {
      form.setError('role', { message: 'Veuillez sélectionner votre profil' })
      return
    }
    setLoading(true)
    try {
      const supabase = createClient()
      console.log('Tentative de connexion Google avec le rôle:', role)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/google-auth?role=${role}`,
          queryParams: {
            role: role,
            next: `/${role}`,
          },
        },
      })

      if (error) {
        console.error('Erreur lors de la connexion Google:', error)
        setError(`Erreur lors de la connexion avec Google: ${error.message}`)
      }
    } catch (error) {
      console.error('Exception lors de la connexion Google:', error)
      setError(`Erreur lors de la connexion avec Google: ${error}`)
    } finally {
      setLoading(false)
    }
  }

  async function onSubmit(values: FormValues) {
    setLoading(true)
    setError('')

    try {
      const formData = new FormData()
      formData.append('email', values.email)
      formData.append('pwd', values.password)
      formData.append('role', values.role)
      formData.append('userAgent', navigator.userAgent)

      const result = await loginAction(formData)

      if (result.success === false) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message,
        })
        return
      }

      router.push(`/${result.role}`)
      toast({
        variant: 'success',
        title: 'Succès',
        description: 'Vous êtes connecté',
      })
    } catch (error: any) {
      setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="h-full w-full bg-background flex items-center justify-center
        px-4 py-4 lg:py-8 relative"
    >
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10
          rounded-full blur-3xl animate-pulse"
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10
          rounded-full blur-3xl animate-pulse delay-1000"
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-96 h-96 bg-gradient-to-r from-primary/5 to-transparent
          rounded-full blur-3xl animate-pulse delay-500"
        />
      </div>

      {/* Main Container */}
      <main
        className="w-full max-w-6xl mx-auto grid lg:grid-cols-2 gap-8 lg:gap-16
        items-center relative z-10"
      >
        {/* Left Side - Branding */}
        <aside className="hidden lg:flex flex-col space-y-8 text-center lg:text-left">
          <div className="space-y-6">
            <div className="inline-flex items-center justify-center lg:justify-start">
              <div
                className="w-16 h-16 bg-gradient-to-br from-primary to-primary-light
                rounded-2xl flex items-center justify-center shadow-2xl
                transform rotate-3 hover:rotate-0 transition-all duration-500"
              >
                <UserGroupIcon className="w-8 h-8 text-primary-foreground" />
              </div>
            </div>

            <div className="space-y-4">
              <h1
                className="text-5xl lg:text-6xl font-bold bg-gradient-to-r
                from-primary to-primary-light bg-clip-text text-transparent"
              >
                Eduroots
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                La plateforme éducative moderne qui connecte enseignants,
                familles et administration
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 max-w-md mx-auto lg:mx-0">
            <div className="flex items-center space-x-3 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Suivi en temps réel</span>
            </div>
            <div className="flex items-center space-x-3 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Communication simplifiée</span>
            </div>
            <div className="flex items-center space-x-3 text-muted-foreground">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-sm">Interface moderne</span>
            </div>
          </div>
        </aside>

        {/* Right Side - Login Form */}
        <aside className="w-full max-w-md mx-auto lg:max-w-none">
          <div
            className="backdrop-blur-xl bg-background/80 border border-border/30
            rounded-3xl shadow-2xl p-4 sm:p-6 lg:p-10 space-y-6 lg:space-y-8"
          >
            {/* Mobile Header */}
            <div className="lg:hidden text-center space-y-3">
              <div
                className="w-12 h-12 mx-auto bg-gradient-to-br from-primary to-primary-light
                rounded-xl flex items-center justify-center shadow-xl
                transform rotate-3 hover:rotate-0 transition-all duration-500"
              >
                <UserGroupIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="space-y-1">
                <h1
                  className="text-2xl font-bold bg-gradient-to-r from-primary
                  to-primary-light bg-clip-text text-transparent"
                >
                  Eduroots
                </h1>
                <p className="text-muted-foreground text-xs">
                  Connectez-vous pour accéder à votre espace
                </p>
              </div>
            </div>

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel
                        className="text-base lg:text-lg font-semibold text-foreground
                        text-center lg:text-left"
                      >
                        Choisissez votre profil
                      </FormLabel>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4 w-full">
                        <button
                          type="button"
                          className={`w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center
                            justify-center rounded-xl border transition-all
                            ${
                    field.value === 'bureau'
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-background text-primary border-border hover:bg-muted'
                    }
                            focus:outline-none focus:ring-2 focus:ring-primary/40`}
                          onClick={() => field.onChange('bureau')}
                          aria-pressed={field.value === 'bureau'}
                        >
                          <BuildingOfficeIcon className="w-7 h-7 mb-1" />
                          <span className="font-medium text-xs sm:text-sm">
                            Bureau
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center
                            justify-center rounded-xl border transition-all
                            ${
                    field.value === 'teacher'
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-background text-primary border-border hover:bg-muted'
                    }
                            focus:outline-none focus:ring-2 focus:ring-primary/40`}
                          onClick={() => field.onChange('teacher')}
                          aria-pressed={field.value === 'teacher'}
                        >
                          <AcademicCapIcon className="w-7 h-7 mb-1" />
                          <span className="font-medium text-xs sm:text-sm">
                            Enseignant
                          </span>
                        </button>
                        <button
                          type="button"
                          className={`w-20 h-20 sm:w-24 sm:h-24 flex flex-col items-center
                            justify-center rounded-xl border transition-all
                            ${
                    field.value === 'student'
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg'
                      : 'bg-background text-primary border-border hover:bg-muted'
                    }
                            focus:outline-none focus:ring-2 focus:ring-primary/40`}
                          onClick={() => field.onChange('student')}
                          aria-pressed={field.value === 'student'}
                        >
                          <HomeIcon className="w-7 h-7 mb-1" />
                          <span className="font-medium text-xs sm:text-sm">
                            Famille
                          </span>
                        </button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Login Options */}
                <div className="space-y-4 lg:space-y-6">
                  {/* Google Login */}
                  <div className="space-y-3">
                    <h3
                      className="text-sm font-medium text-muted-foreground
                      text-center lg:text-left"
                    >
                      Connexion rapide
                    </h3>

                    <Button
                      type="button"
                      onClick={signInWithGoogle}
                      disabled={loading}
                      aria-label="Se connecter avec Google"
                      className="w-full flex items-center justify-center p-0 border border-[#4285F4]
                      bg-background hover:bg-background rounded-lg shadow-sm hover:border-[#4285F4]
                      transition-all duration-200 hover:shadow-[0_0_0_5px_#e8f0fe]"
                    >
                      <span
                        className="icon inline-flex self-stretch items-center justify-center
                       px-2 border-r border-[#4285F4]"
                      >
                        <svg
                          viewBox="0 0 533.5 544.3"
                          xmlns="http://www.w3.org/2000/svg"
                          width="18"
                          height="18"
                          className="fill-current"
                        >
                          <path
                            d="M533.5 278.4c0-18.5-1.5-37.1-4.7-55.3H272.1v104.8h147c-6.1 33.8-25.7
                            63.7-54.4 82.7v68h87.7c51.5-47.4 81.1-117.4 81.1-200.2z"
                            fill="#4285f4"
                          />
                          <path
                            d="M272.1 544.3c73.4 0 135.3-24.1 180.4-65.7l-87.7-68c-24.4 16.6-55.9
                            26-92.6 26-71 0-131.2-47.9-152.8-112.3H28.9v70.1c46.2 91.9 140.3 149.9
                            243.2 149.9z"
                            fill="#34a853"
                          />
                          <path
                            d="M119.3 324.3c-11.4-33.8-11.4-70.4 0-104.2V150H28.9c-38.6 76.9-38.6
                            167.5 0 244.4l90.4-70.1z"
                            fill="#fbbc04"
                          />
                          <path
                            d="M272.1 107.7c38.8-.6 76.3 14 104.4 40.8l77.7-77.7C405 24.6 339.7-.8
                            272.1 0 169.2 0 75.1 58 28.9 150l90.4 70.1c21.5-64.5 81.8-112.4
                            152.8-112.4z"
                            fill="#ea4335"
                          />
                        </svg>
                      </span>
                      <span
                        className="flex-1 text-[#4285F4] font-medium text-base text-center
                        transition-all duration-200 group-hover:text-white hover:cursor-pointer"
                      >
                        {loading ? 'Connexion...' : 'Se connecter avec Google'}
                      </span>
                    </Button>
                  </div>

                  {/* Divider */}
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span
                        className="px-3 bg-background/80 text-muted-foreground
                        font-bold text-base tracking-wide"
                      >
                        OU
                      </span>
                    </div>
                  </div>

                  {/* Email Form */}
                  <div className="space-y-3 lg:space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel className="block text-sm font-medium text-foreground">
                            Email
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="Entrez votre email"
                              className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg
                                border border-border bg-input text-foreground lg:text-base
                                focus:border-primary focus:outline-none focus:ring-2
                                focus:ring-primary/50 disabled:bg-muted
                                disabled:cursor-not-allowed"
                              disabled={loading || !form.watch('role')}
                            />
                          </FormControl>
                          {!form.watch('role') && (
                            <p className="text-sm text-error mt-1">
                              Sélectionnez d'abord votre profil
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem className="relative">
                          <FormLabel className="block text-sm font-medium text-foreground">
                            Mot de passe
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Entrez votre mot de passe"
                                className="w-full px-3 lg:px-4 py-2.5 lg:py-3 rounded-lg
                                border border-border bg-input text-foreground lg:text-base
                                focus:border-primary focus:outline-none focus:ring-2
                                focus:ring-primary/50 disabled:bg-muted
                                disabled:cursor-not-allowed"
                                disabled={loading || !form.watch('role')}
                              />
                              <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2.5 lg:right-3 top-2.5 lg:top-3
                                text-muted-foreground hover:text-primary transition-colors
                                disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={loading || !form.watch('role')}
                              >
                                {showPassword ? (
                                  <EyeSlashIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                                ) : (
                                  <EyeIcon className="w-4 h-4 lg:w-5 lg:h-5" />
                                )}
                              </button>
                            </div>
                          </FormControl>
                          {!form.watch('role') && (
                            <p className="text-sm text-error mt-1">
                              Sélectionnez d'abord votre profil
                            </p>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end">
                      {form.watch('role') ? (
                        <Link
                          href={`/forgot-password?role=${form.watch('role')}`}
                          className="text-xs lg:text-sm text-primary hover:text-primary-dark
                            transition-colors font-medium"
                        >
                          Mot de passe oublié ?
                        </Link>
                      ) : (
                        <p className="text-xs lg:text-sm text-error">
                          Sélectionnez d'abord votre profil
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      disabled={loading || !form.watch('role')}
                      variant="default"
                    >
                      {loading ? 'Connexion...' : 'Se connecter'}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>

            {/* Alerts */}
            {error && (
              <div
                className="p-2.5 lg:p-3 bg-error/10 border border-error/20
                rounded-xl lg:rounded-2xl"
              >
                <p className="text-center text-xs lg:text-sm text-error">
                  {error}
                </p>
              </div>
            )}

            {/* Footer */}
            <div className="pt-3 lg:pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground text-center">
                En vous connectant, vous acceptez nos
                <Link
                  href="/terms"
                  className="text-primary hover:underline ml-1"
                >
                  conditions d'utilisation
                </Link>
              </p>
            </div>

            {/* PWA Button */}
            <div className="mt-6 text-center">
              <PWAButtonClient />
            </div>
          </div>
        </aside>
      </main>
    </motion.div>
  )
}
