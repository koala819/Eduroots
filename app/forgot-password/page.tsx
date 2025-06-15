'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useRouter, useSearchParams } from 'next/navigation'
import { forgotPassword } from '@/app/forgot-password/actions'

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
          className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12
        sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl
            shadow-xl"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
                Mot de passe oublié
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Adresse email
                </label>
                <Input
                  type="email"
                  name="email"
                  disabled={loading}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Entrez votre adresse email"
                  className="w-full"
                  required
                />
                <p className="text-xs text-gray-500">
                  Un email de réinitialisation sera envoyé à cette adresse.
                </p>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || !email}
                  className="w-full bg-gradient-to-r from-[#375073] to-[#4a6b95]"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer l\'email de réinitialisation'}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBackToLogin}
                  className="w-full"
                >
                  Retour à la connexion
                </Button>
              </div>
            </div>
          </motion.div>
        </form>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 py-12
        sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl
            shadow-xl text-center"
          >
            <div className="space-y-4">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center
              justify-center">
                <svg className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24">
                  <path strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="text-3xl font-bold text-gray-900">
                Email envoyé
              </h2>

              <p className="text-sm text-gray-600">
                Un email de réinitialisation a été envoyé à <strong>{email}</strong>
              </p>

              <p className="text-xs text-gray-500">
                  Vérifiez votre boîte mail et cliquez sur le lien pour réinitialiser votre mot
                  de passe.
              </p>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleBackToLogin}
                className="w-full bg-gradient-to-r from-[#375073] to-[#4a6b95]"
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
