'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { linkAccount } from '@/app/link-account/actions'
import { useRouter } from 'next/navigation'
import { getRoleName } from '@/utils/supabase/redirects'

interface LinkAccountFormProps {
  googleEmail: string
  provider: string
  authId: string
  role: string
}

export default function LinkAccountForm({
  googleEmail,
  provider,
  authId,
  role,
}: Readonly<LinkAccountFormProps>) {
  const [baseEmail, setBaseEmail] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [codeSended, setCodeSended] = useState<boolean>(false)
  const { toast } = useToast()
  const router = useRouter()


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData = new FormData()
      formData.append('email', baseEmail)
      formData.append('googleEmail', googleEmail)
      formData.append('provider', provider)
      formData.append('role', role)
      formData.append('auth_id', authId)

      const result = await linkAccount(formData)

      if (result.error) {
        console.log(result.error)
        toast({
          variant: 'destructive',
          title: 'Erreur',
          description: result.error,
        })
        router.push('/error')
        return
      }

      toast({
        title: 'Email envoyé',
        description: 'Veuillez vérifier votre boîte mail pour confirmer la liaison de votre'+
        'compte.',
      })

      setCodeSended(true)
    } catch (error) {
      console.error('Erreur lors de la liaison du compte:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de la liaison du compte.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {!codeSended ? (
        <form
          onSubmit={handleSubmit}
          className="flex min-h-screen flex-col items-center justify-center bg-gray-50
      py-12 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm
        rounded-2xl shadow-xl"
          >
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">
            Liaison de compte {getRoleName(role)}
              </h2>
              <p className="mt-2 text-sm text-gray-600">
            Vous êtes connecté avec {googleEmail} via {provider}
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Votre email Eduroots
                </label>
                <Input
                  type="email"
                  name="email"
                  disabled={loading}
                  value={baseEmail}
                  onChange={(e) => setBaseEmail(e.target.value)}
                  placeholder="Entrez votre email habituel"
                  className='w-full'
                  required
                />
                <p className="text-xs text-gray-500">
              Un email de vérification sera envoyé à cette adresse.
                </p>
              </div>
              <Button
                type="submit"
                disabled={loading || !baseEmail}
                className="w-full bg-gradient-to-r from-[#375073] to-[#4a6b95]"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer l\'email de vérification'}
              </Button>
            </div>
          </motion.div>
        </form>
      ) : (
        <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50
      py-12 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900">
          Email envoyé
          </h2>
          <p className="text-sm text-gray-600">
            Un email de vérification a été envoyé à {baseEmail}
          </p>
        </div>
      )}
    </>
  )
}
