import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

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
  const role = searchParams.get('role')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // console.log('Callback - Paramètres reçus:', {
  //   role,
  //   code: code ? 'présent' : 'absent',
  //   error,
  //   errorDescription,
  //   allParams: Object.fromEntries(searchParams.entries()),
  // })

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
      // Vérifier si l'utilisateur existe dans la base de données
      const { data: find_user_in_education_users, error: find_user_in_education_users_error } =
        await supabase
          .schema('education')
          .from('users')
          .select('*')
          .eq('email', data_from_auth.email)
          .eq('role', role)
          .maybeSingle()

      if (find_user_in_education_users_error) {
        console.error('Erreur lors de la recherche de l\'utilisateur:'
          , find_user_in_education_users_error)
        return NextResponse.redirect(
          new URL('/error?message=Erreur lors de la vérification du compte', request.url),
        )
      }

      // Si l'utilisateur n'est pas trouvé dans la base de données,
      // redirection vers link-account avec les infos Google
      if (!find_user_in_education_users) {
        console.log('Utilisateur non trouvé dans la base de données ou rôle incorrect,' +
          ' redirection vers link-account avec les infos Google')
        return NextResponse.redirect(
          new URL(
            `/link-account?email=${encodeURIComponent(data_from_auth.email!)}
            &provider=google&auth_id=${data_from_auth.id}&role=${role}`,
            request.url,
          ),
        )
      }

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

  redirect('/error')
}
