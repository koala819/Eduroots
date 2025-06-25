'use client'

import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { Button } from '@/client/components/ui/button'
import { Input } from '@/client/components/ui/input'
import { useToast } from '@/client/hooks/use-toast'
import { forgotPassword } from '@/server/actions/forgot-pwd'

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState<string>('')
  const [role, setRole] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [emailSent, setEmailSent] = useState<boolean>(false)
  const { toast } = useToast()
  const router = useRouter()

  const searchParams = useSearchParams()
  const roleParam = searchParams.get('role')

  useEffect(() => {
    if (roleParam) {
      setRole(roleParam)
    }
  }, [roleParam])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', email)

      const result = await forgotPassword(formData, role)

      if (!result.success) {
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.message,
        })
        return
      }

      if (result.success) {
        toast({
          variant: 'success',
          title: 'Email envoyé',
          description: result.message,
        })
        setEmailSent(true)
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de l\'email:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l\'envoi de l\'email.',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBackToLogin = () => {
    router.push('/')
  }

  return (
    <>
      {!emailSent ? (
        <form
          onSubmit={handleSubmit}
          className="flex min-h-screen w-full flex-col items-center justify-center p-4
          sm:p-6 lg:p-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8 rounded-2xl bg-background p-6 shadow-lg sm:p-8">
            <div className="text-center">
              <h1 className="text-2xl font-semibold text-foreground">
                Mot de passe oublié
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-foreground">
                  Adresse email
                </label>
                <Input
                  type="email"
                  name="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre adresse email"
                  className="w-full rounded-md border border-border bg-input px-3 py-2
                    text-foreground transition-colors focus:border-primary
                    focus:outline-none focus:ring-2 focus:ring-ring"
                  required
                />
                <p className="text-xs text-muted-foreground">
                  Un email de réinitialisation sera envoyé à cette adresse.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !email}
                  className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground
                    shadow-sm transition-all hover:bg-primary-dark
                    hover:shadow-md disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer l\'email de réinitialisation'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToLogin}
                  className="w-full rounded-md border border-border bg-secondary px-4 py-2
                    text-secondary-foreground transition-all hover:bg-secondary-dark
                    hover:border-primary"
                >
                  Revenir à l&apos;écran Principal
                </Button>
              </div>
            </div>
          </motion.div>
        </form>
      ) : (
        <div className="flex min-h-screen w-full flex-col items-center justify-center py-12
        px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-md space-y-8 rounded-2xl bg-surface-1 p-6 text-center
            shadow-lg sm:p-8"
          >
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full
              bg-success/10">
                <svg className="h-8 w-8 text-success"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-foreground">
                Email envoyé
              </h2>

              <p className="text-sm text-muted-foreground">
                Un email de réinitialisation a été envoyé à
                <strong className="text-foreground">{' '}{email}</strong>
              </p>

              <p className="text-xs text-muted-foreground">
                Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot
                de passe.
              </p>
            </div>

            <div className="flex flex-col">
              <Button
                onClick={handleBackToLogin}
                variant="default"
              >
                Retour à la connexion
              </Button>

              {/* <Button
                variant="outline"
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="w-full"
              >
                Renvoyer un email
              </Button> */}
            </div>
          </motion.div>
        </div>
      )}
    </>
  )
}
