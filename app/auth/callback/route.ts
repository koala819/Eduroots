// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Vérifier si l'email existe dans education.users
      const { data: educationUser } = await supabase
        .from('education.users')
        .select('*')
        .eq('email', data.user.email)
        .single()

      if (educationUser) {
        // Mettre à jour le rôle si nécessaire
        await supabase
          .from('education.users')
          .update({
            auth_id: data.user.id,
            role: role, // Mettre à jour le rôle
          })
          .eq('id', educationUser.id)

        redirect('/dashboard')
      } else {
        // Rediriger vers une page de liaison de compte
        redirect(`/link-account?email=${data.user.email}&role=${role}`)
      }
    }
  }

  redirect('/error')
}
