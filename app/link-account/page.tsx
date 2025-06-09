// app/link-account/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { checkUserExists } from '@/app/actions/auth'

function LinkAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleEmail = searchParams.get('email')
  const provider = searchParams.get('provider')
  const authId = searchParams.get('auth_id')
  const role = searchParams.get('role')

  const [baseEmail, setBaseEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const { toast } = useToast()

  // Vérifier si nous avons les informations nécessaires
  useEffect(() => {
    if (!googleEmail || !provider || !authId || !role) {
      console.error('Informations manquantes:', { googleEmail, provider, authId, role })
      toast({
        variant: 'destructive',
        title: 'Erreur de connexion',
        description: 'Informations d\'authentification manquantes. Veuillez réessayer.',
      })
      router.push('/')
      return
    }
  }, [googleEmail, provider, authId, role, router, toast, searchParams])

  const sendVerificationCode = async () => {
    setLoading(true)
    try {
      const { exists, user } = await checkUserExists(baseEmail, role!)
      console.log('Vérification utilisateur:', {
        email: baseEmail,
        role,
        exists,
        user,
      })

      if (!exists) {
        toast({
          title: 'Email non trouvé',
          description: 'Cet email n\'existe pas dans notre base.',
          variant: 'destructive',
        })
        return
      }

      // Générer et envoyer le code via OTP Supabase
      const supabase = createClient()
      console.log('Envoi du code OTP avec les données:', {
        email: baseEmail,
        role: user.role,
        authId,
        provider,
        googleEmail,
      })

      const { error: otpError } = await supabase.auth.signInWithOtp({
        email: baseEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/link-account`,
          data: {
            role: user.role,
            auth_id: authId,
            provider: provider,
            google_email: googleEmail,
          },
        },
      })

      if (otpError) {
        console.error('Erreur lors de l\'envoi du code:', otpError)
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors de l\'envoi du code.',
          variant: 'destructive',
        })
        return
      }

      setIsCodeSent(true)
      toast({
        title: 'Email envoyé',
        description: 'Un email de vérification a été envoyé à votre adresse email.',
      })
    } catch (error) {
      console.error('Erreur lors de l\'envoi du code:', error)
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'envoi du code.',
      })
    } finally {
      setLoading(false)
    }
  }

  const verifyAndLink = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      const { data: codeData } = await supabase
        .from('system.verification_codes')
        .select('*')
        .eq('email', baseEmail)
        .eq('code', verificationCode)
        .single()

      if (!codeData) {
        toast({
          variant: 'destructive',
          title: 'Code invalide',
          description: 'Le code de vérification est incorrect ou a expiré.',
        })
        return
      }

      // Mettre à jour l'utilisateur avec l'auth_id et le rôle
      await supabase
        .schema('education')
        .from('users')
        .update({
          auth_id: authId,
          role: role,
        })
        .eq('email', baseEmail)

      await supabase
        .from('system.verification_codes')
        .delete()
        .eq('id', codeData.id)

      toast({
        title: 'Compte lié avec succès',
        description: 'Votre compte a été lié avec succès.',
      })

      // Rediriger vers la page appropriée selon le rôle
      // const redirectPath = getRedirectUrl(role)
      // router.push(redirectPath)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la liaison du compte.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center
    justify-center bg-gray-50 py-12 sm:px-6 lg:px-8">

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-6 sm:p-8
        bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl"
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r
          from-[#375073] to-[#4a6b95] bg-clip-text text-transparent">
            Rôle
            <span className='ml-2 uppercase font-bolder'>{role}</span>
          </h2>
          <div className="space-y-2">
            <p className="text-gray-600">
              Vous êtes connecté avec Google en tant que :
            </p>
            <p className="font-medium text-[#375073] break-all">
              {googleEmail}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            Pour finaliser votre connexion, nous avons besoin de vérifier votre identité.
            Veuillez saisir l'adresse email que vous utilisez habituellement dans l'application.
          </p>
        </div>

        {!isCodeSent ? (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Votre email Eduroots
              </label>
              <Input
                type="email"
                disabled={loading}
                value={baseEmail}
                onChange={(e) => setBaseEmail(e.target.value)}
                placeholder="Entrez votre email habituel"
                className='w-full'
              />
              <p className="text-xs text-gray-500">
                Si vous avez oublié votre email, veuillez contacter le support.
              </p>
            </div>
            <Button
              onClick={sendVerificationCode}
              disabled={loading || !baseEmail}
              className="w-full bg-gradient-to-r from-[#375073] to-[#4a6b95]"
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le code de vérification'}
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Code de vérification
              </label>
              <Input
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="Entrez le code reçu"
                className="w-full"
              />
              <p className="text-sm text-gray-500">
                Un code a été envoyé à {baseEmail}
              </p>
            </div>
            <Button
              onClick={verifyAndLink}
              disabled={loading || !verificationCode}
              className="w-full bg-gradient-to-r from-[#375073] to-[#4a6b95]"
            >
              {loading ? 'Vérification...' : 'Vérifier et lier le compte'}
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  )
}

export default function LinkAccount() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#375073]"></div>
      </div>
    }>
      <LinkAccountContent />
    </Suspense>
  )
}
