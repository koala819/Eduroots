// app/link-account/page.tsx
'use client'

import { useState, useEffect, Suspense } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { motion } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'

function LinkAccountContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const googleEmail = searchParams.get('email')
  const role = searchParams.get('role')

  const [baseEmail, setBaseEmail] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [emailExists, setEmailExists] = useState<boolean | null>(null)
  const { toast } = useToast()

  // Vérifier si l'email Google existe dans la base
  useEffect(() => {
    console.log('URL params:', {
      email: googleEmail,
      role: role,
      rawUrl: window.location.href,
      allParams: Array.from(searchParams.entries()),
    })

    let isMounted = true

    const checkEmail = async () => {
      if (!googleEmail) {
        console.error('Email Google manquant')
        toast({
          variant: 'destructive',
          title: 'Erreur de connexion',
          description: 'Impossible de récupérer votre email Google. Veuillez réessayer.',
        })
        return
      }

      try {
        const supabase = createClient()
        const { data: user } = await supabase
          .schema('education')
          .from('users')
          .select('*')
          .eq('email', googleEmail)
          .single()

        console.log('Vérification email Google:', { googleEmail, user })

        if (user && isMounted) {
          // Lier automatiquement le compte
          const { data: { user: authUser } } = await supabase.auth.getUser()
          console.log('Auth user:', authUser)

          await supabase
            .schema('education')
            .from('users')
            .update({
              auth_id: authUser?.id,
              role: role,
            })
            .eq('email', googleEmail)

          toast({
            title: 'Compte lié avec succès',
            description: 'Votre compte Google a été lié avec succès.',
          })
          // router.push('/')
        } else if (isMounted) {
          setEmailExists(false)
        }
      } catch (error) {
        console.error('Erreur lors de la vérification:', error)
        if (isMounted) {
          toast({
            variant: 'destructive',
            title: 'Erreur',
            description: 'Une erreur est survenue lors de la vérification.',
          })
        }
      }
    }

    if (emailExists === null && googleEmail) {
      checkEmail()
    }

    return () => {
      isMounted = false
    }
  }, [googleEmail, role, emailExists, router, toast, searchParams])

  const sendVerificationCode = async () => {
    setLoading(true)
    try {
      const supabase = createClient()

      // Vérifier si l'email existe dans la base
      const { data: user } = await supabase
        .schema('education')
        .from('users')
        .select('*')
        .eq('email', baseEmail)
        .single()

      console.log('Vérification email base:', { baseEmail, user })

      if (!user) {
        toast({
          variant: 'destructive',
          title: 'Email non trouvé',
          description: 'Cet email n\'existe pas dans notre base. Si vous avez oublié votre email, veuillez contacter le support.',
        })
        return
      }

      // Générer et envoyer le code
      const code = Math.random().toString(36).substring(2, 8).toUpperCase()
      await supabase
        .from('system.verification_codes')
        .insert({
          email: baseEmail,
          code: code,
          expires_at: new Date(Date.now() + 15 * 60000),
        })

      await supabase.functions.invoke('send-verification-code', {
        body: { email: baseEmail, code },
      })

      setIsCodeSent(true)
      toast({
        title: 'Code envoyé',
        description: 'Un code de vérification a été envoyé à votre adresse email.',
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

      const { data: { user } } = await supabase.auth.getUser()
      await supabase
        .schema('education')
        .from('users')
        .update({
          auth_id: user?.id,
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

      // router.push('/')
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

  if (emailExists === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#375073] mx-auto"></div>
          <p className="mt-4 text-gray-600">Vérification de votre compte...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full space-y-8 p-6 sm:p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl"
      >
        <div className="text-center space-y-4">
          <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[#375073] to-[#4a6b95] bg-clip-text text-transparent">
            Connexion avec Google
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
                value={baseEmail}
                onChange={(e) => setBaseEmail(e.target.value)}
                placeholder="Entrez votre email habituel"
                className="w-full"
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
