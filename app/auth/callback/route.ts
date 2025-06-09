import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'

// Fonction utilitaire pour obtenir l'URL de redirection selon le rôle
function getRedirectUrl(role: string) {
  switch (role) {
  case 'bureau':
  case 'admin':
    return '/admin'
  case 'teacher':
    return '/teacher'
  case 'student':
    return '/student'
  default:
    return '/link-account'
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)

  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  if (error) {
    console.error('Erreur Supabase:', {
      error,
      errorDescription,
      errorCode: searchParams.get('error_code'),
    })
    redirect('/error')
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Erreur lors de l\'échange du code:', error)
      redirect('/error')
    }

    const data_from_auth = data.user


    if (!error && data_from_auth) {
      const { data: find_user_in_education_users, error: findUserError } = await supabase
        .schema('education')
        .from('users')
        .select('id, role, firstname, lastname')
        .eq('email', data_from_auth.email)
        .single()

      if (findUserError) {
        console.error('Erreur lors de la recherche de l\'utilisateur:', findUserError)
        redirect('/error')
      }


      if (find_user_in_education_users) {
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: {
            firstname: find_user_in_education_users.firstname,
            lastname: find_user_in_education_users.lastname,
            role: find_user_in_education_users.role,
          },
        })

        if (updateUserError) {
          console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateUserError)
          redirect('/error')
        }

        const { error: updateEducationUserError } = await supabase
          .schema('education')
          .from('users')
          .update({ auth_id: data_from_auth.id })
          .eq('id', find_user_in_education_users.id)

        if (updateEducationUserError) {
          console.error('Erreur lors de la mise à jour de'+
            'education.users: ', updateEducationUserError)
          redirect('/error')
        }

        const redirectPath = getRedirectUrl(find_user_in_education_users.role)
        redirect(redirectPath)
      }
    }
  }

  redirect('/error')
}
