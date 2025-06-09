import { createClient } from '@/utils/supabase/server'
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
  const code = searchParams.get('code')
  const role = searchParams.get('role')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Link Account - Paramètres reçus:', {
    code: code ? 'présent' : 'absent',
    role,
    error,
    errorDescription,
  })

  if (error) {
    console.error('Erreur Supabase:', {
      error,
      errorDescription,
      errorCode: searchParams.get('error_code'),
    })
    return NextResponse.redirect(new URL('/error', request.url))
  }

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Erreur lors de l\'échange du code:', error)
      return NextResponse.redirect(new URL('/error', request.url))
    }

    if (!data.user) {
      console.error('Aucun utilisateur trouvé après l\'échange du code')
      return NextResponse.redirect(
        new URL('/error?message=Session utilisateur non trouvée', request.url),
      )
    }

    // Récupérer l'auth_id et le rôle depuis les métadonnées
    const auth_id = data.user.user_metadata.auth_id
    const role = data.user.user_metadata.role

    console.log('Link Account - Données utilisateur:', {
      email: data.user.email,
      metadata: data.user.user_metadata,
    })

    // Vérifier si l'utilisateur existe dans la base de données
    const { data: users, error: find_user_in_education_users_error } =
      await supabase
        .schema('education')
        .from('users')
        .select('*')
        .eq('email', data.user.email)
        .eq('role', role)

    console.log('Link Account - Recherche utilisateur:', {
      email: data.user.email,
      role: role,
      usersFound: users?.length || 0,
      error: find_user_in_education_users_error,
    })

    if (find_user_in_education_users_error) {
      console.error('Erreur lors de la recherche de l\'utilisateur:',
        find_user_in_education_users_error)
      return NextResponse.redirect(
        new URL('/error?message=Erreur lors de la vérification du compte', request.url),
      )
    }

    if (!users || users.length === 0) {
      console.error('Utilisateur non trouvé dans la base de données:', {
        email: data.user.email,
        role: role,
      })
      return NextResponse.redirect(
        new URL('/error?message=Utilisateur non trouvé avec ce rôle', request.url),
      )
    }

    // On ne devrait avoir qu'un seul utilisateur maintenant
    const user = users[0]
    console.log('Utilisateur sélectionné:', {
      email: user.email,
      role: user.role,
      id: user.id,
    })

    // Vérification de sécurité supplémentaire
    if (user.role !== role) {
      console.error('Incohérence de rôle:', {
        expected: role,
        found: user.role,
      })
      return NextResponse.redirect(
        new URL('/error?message=Incohérence de rôle détectée', request.url),
      )
    }

    // Mettre à jour l'utilisateur avec l'auth_id
    const { error: updateError } = await supabase
      .schema('education')
      .from('users')
      .update({ auth_id: auth_id })
      .eq('id', user.id)

    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateError)
      return NextResponse.redirect(
        new URL('/error?message=Erreur lors de la liaison du compte', request.url),
      )
    }

    // Mettre à jour les métadonnées utilisateur
    const { error: updateUserError } = await supabase.auth.updateUser({
      data: {
        firstname: user.firstname,
        lastname: user.lastname,
        role: user.role,
      },
    })

    if (updateUserError) {
      console.error('Erreur lors de la mise à jour des métadonnées:', updateUserError)
      return NextResponse.redirect(
        new URL('/error?message=Erreur lors de la mise à jour des métadonnées', request.url),
      )
    }

    // Rediriger vers la page appropriée selon le rôle
    const redirectPath = getRedirectUrl(user.role)
    return NextResponse.redirect(new URL(redirectPath, request.url))
  }

  // Si pas de code ou erreur, rediriger vers la page d'erreur
  return NextResponse.redirect(new URL('/error', request.url))
}
