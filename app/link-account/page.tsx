import { redirect } from 'next/navigation'

import { getRedirectUrl } from '@/server/utils/redirects'
import { createClient } from '@/server/utils/supabase'

import LinkAccountForm from './LinkAccountForm'

export default async function LinkAccountPage({
  searchParams,
}: Readonly<{
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}>) {
  const supabase = await createClient()

  // Vérification de la session
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    redirect('/')
  }

  // Validation des paramètres
  const { email: googleEmail, provider, auth_id, role } = await searchParams

  if (!provider || !auth_id || !role || !googleEmail) {
    redirect('/auth/error?message=Paramètres manquants')
  }

  // cas specifique pour admin
  // !todo: dans /app/auth/google-auth one ne gere pas le cas du role admin
  const { data: user, error: userError } = await supabase
    .schema('education')
    .from('users')
    .select('*')
    .eq('email', googleEmail)
    .eq('role', role)

  if (userError) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', userError)
    redirect('/auth/error?message=Erreur lors de la recherche de l\'utilisateur')
  }

  if (user) {
    const redirectUrl = getRedirectUrl(role as string)
    console.log('redirectUrl', redirectUrl)
    redirect(redirectUrl)
  }

  return <LinkAccountForm
    googleEmail={googleEmail as string}
    provider={provider as string}
    authId={auth_id as string}
    role={role as string}
  />
}
