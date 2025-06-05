
// app/link-account/actions.ts
'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function linkAccount(formData: FormData) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  // 1. Vérifier si l'email existe dans education.users
  const { data: user } = await supabase
    .from('education.users')
    .select('*')
    .eq('email', email)
    .single()

  if (!user) {
    // Rediriger vers une page d'erreur
    redirect('/error?message=Email non trouvé')
  }

  // 2. Récupérer l'utilisateur Google/Apple
  const { data: { user: authUser } } = await supabase.auth.getUser()

  // 3. Mettre à jour education.users
  await supabase
    .from('education.users')
    .update({ auth_id: authUser?.id })
    .eq('id', user.id)

  // 4. Rediriger vers le dashboard
  redirect('/dashboard')
}
