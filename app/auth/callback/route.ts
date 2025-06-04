// app/auth/callback/route.ts
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Fonction utilitaire pour obtenir l'URL de redirection selon le rôle
function getRedirectUrl(role: string) {
  switch (role) {
  case 'bureau':
    return '/admin'
  case 'enseignant':
    return '/teacher'
  case 'famille':
    return '/student'
  default:
    return '/home'
  }
}

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
        .schema('education')
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .single()

      if (educationUser) {
        // Mettre à jour education.users avec l'auth_id
        await supabase
          .schema('education')
          .from('users')
          .update({
            auth_id: data.user.id,
          })
          .eq('id', educationUser.id)

        // IMPORTANT: Stocker le rôle dans les métadonnées utilisateur Supabase
        await supabase.auth.updateUser({
          data: {
            role: educationUser.role, // Utiliser le rôle de education.users
            firstname: educationUser.firstname,
            lastname: educationUser.lastname,
          },
        })

        // Redirection selon le rôle du profil sélectionné
        const redirectPath = getRedirectUrl(role || 'default')
        redirect(redirectPath)
      } else {
        // Rediriger vers une page de liaison de compte
        redirect(`/link-account?email=${data.user.email}&role=${role}`)
      }
    }
  }

  redirect('/error')
}
