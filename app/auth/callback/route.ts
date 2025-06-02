
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // 1. Vérifier si l'email Google/Apple existe dans education.users
      const { data: educationUser } = await supabase
        .from('education.users')
        .select('*')
        .eq('email', data.user.email)
        .single()

      if (educationUser) {
        // 2. Si oui, lier automatiquement les comptes
        await supabase
          .from('education.users')
          .update({ auth_id: data.user.id })
          .eq('id', educationUser.id)

        // Rediriger vers le dashboard
        redirect('/dashboard')
      } else {
        // 3. Si non, rediriger vers la page de liaison
        redirect(`/link-account?provider_email=${data.user.email}`)
      }
    }
  }

  redirect('/error')
}

