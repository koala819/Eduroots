import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
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

  return <LinkAccountForm
    googleEmail={googleEmail as string}
    provider={provider as string}
    authId={auth_id as string}
    role={role as string}
  />
}
