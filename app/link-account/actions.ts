'use server'

import { createClient } from '@/utils/supabase'
import { redirect } from 'next/navigation'

export async function linkAccount(formData: FormData) {
  const supabase = await createClient()

  // Vérification de la session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const email = formData.get('email') as string
  const googleEmail = formData.get('googleEmail') as string
  const provider = formData.get('provider') as string
  const role = formData.get('role') as string
  const authId = formData.get('auth_id') as string

  // Vérification que l'email existe dans la base
  const { data: user, error: userError } = await supabase
    .schema('education')
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', role)

  if (userError || !user || user.length === 0) {
    return {
      error: 'Utilisateur inconnu, au revoir !',
    }
  }

  // Envoi de l'email de vérification via Supabase
  const { error: emailError } = await supabase.auth.signInWithOtp({
    email: email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}/auth/link-account`,
      data: {
        role: role,
        auth_id: authId,
        provider: provider,
        google_email: googleEmail,
      },
    },
  })

  if (emailError) {
    return {
      error: 'Erreur lors de l\'envoi de l\'email de vérification',
    }
  }

  return {
    success: true,
    message: 'Un email de vérification a été envoyé à votre adresse.',
  }
}
