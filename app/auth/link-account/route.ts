import { NextResponse } from 'next/server'

import { createClient } from '@/server/utils/supabase'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  // const error = searchParams.get('error')
  // const errorDescription = searchParams.get('error_description')



  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.user) {
      console.error('Erreur lors de l\'échange du code:', error)
      return NextResponse.redirect(new URL('/error', request.url))
    }

    // Récupération des métadonnées
    const auth_id = data.user.user_metadata.auth_id
    const role = data.user.user_metadata.role

    // console.log('Link Account - Paramètres reçus:', {
    //   code: code ? 'présent' : 'absent',
    //   role,
    //   auth_id,
    //   'Données utilisateur': {
    //     email: data.user.email,
    //     metadata: data.user.user_metadata,
    //   },
    // })

    // inserer auth_id dans auth_id de education.users
    const { data: user, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select()
      .or(`email.eq.${data.user.email},secondary_email.eq.${data.user.email}`)
      .eq('role', role)
      .single()

    if (userError) {
      console.error('Erreur lors de la recherche de l\'utilisateur:', userError)
      return NextResponse.redirect(
        new URL('/error?message=Erreur lors de la vérification du compte', request.url),
      )
    }

    // Puis faire l'update sur l'ID trouvé
    const { error: updateError } = await supabase
      .schema('education')
      .from('users')
      .update({ auth_id: auth_id })
      .eq('id', user.id)
      // .select() // optionnel, pour récupérer les données mises à jour

    // Après l'update de auth_id
    if (updateError) {
      console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateError)
      return NextResponse.redirect(
        new URL('/error?message=Erreur lors de la liaison du compte', request.url),
      )
    }

    // Mise à jour des métadonnées de l'utilisateur Supabase
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

    // Redirection vers la page appropriée selon le rôle
    return NextResponse.redirect(new URL(`/${role}`, request.url))
  }
}
