import { SupabaseClient } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'

import { getOriginalEmail } from '@/server/utils/auth-helpers'
import { getRedirectUrl } from '@/server/utils/redirects'
import { createClient } from '@/server/utils/supabase'



export async function GET(request: Request) {

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  console.log('Google Auth - Paramètres reçus:', {
    role,
    code: code ? 'présent' : 'absent',
    error,
    errorDescription,
    allParams: Object.fromEntries(searchParams.entries()),
  })

  if (error) {
    console.error('Erreur Supabase:', {
      error,
      errorDescription,
      errorCode: searchParams.get('error_code'),
    })
    redirect('/error')
  }

  if (!code) {
    redirect('/error')
  }

  const supabase = await createClient()

  const { data, error: authError } = await supabase.auth.exchangeCodeForSession(code)

  if (authError) {
    console.error('Erreur lors de l\'échange du code:', authError)
    return NextResponse.redirect(new URL('/error', request.url))
  }

  const data_from_auth = data.user
  if (!data_from_auth || !data_from_auth.email) {
    redirect('/error')
  }

  const {
    data: existingLinkedUser,
    error: existingLinkedUserError,
  } = await findUserInDatabase(supabase, data_from_auth.id, role!)

  if (existingLinkedUserError) {
    console.error('Erreur lors de la vérification du compte:', existingLinkedUserError)
    return NextResponse.redirect(new URL('/error', request.url))
  }

  if (existingLinkedUser) {
    await userUpdate(supabase, data_from_auth, existingLinkedUser)

    const redirectUrl = getRedirectUrl(existingLinkedUser.role)

    redirect(redirectUrl)
  }

  const originalEmail = getOriginalEmail(data_from_auth.email!)
  if (!originalEmail) {
    console.error('Email manquant dans google-auth pour la mise à jour')
    return NextResponse.redirect(new URL('/error', request.url))
  }

  const { data: userData, error: findError } =
    await findUserInDatabase(supabase, originalEmail, role!)

  if (findError) {
    return NextResponse.redirect(
      new URL('/error?message=Erreur lors de la vérification du compte', request.url),
    )
  }

  if (!userData) {
    return NextResponse.redirect(
      new URL(
        `/link-account?email=${encodeURIComponent(data_from_auth.email!)}
        &provider=google&auth_id=${data_from_auth.id}&role=${role}`,
        request.url,
      ),
    )
  }

  await userUpdate(supabase, data_from_auth, userData)
  const redirectUrl = getRedirectUrl(userData.role)
  redirect(redirectUrl)
}

async function findUserInDatabase(
  supabase: SupabaseClient,
  value: string,
  role: string,
) {
  // Cas spécial pour les rôles admin/bureau
  const adminRoles = ['admin', 'bureau']
  const isAdminRole = adminRoles.includes(role)

  // Déterminer si on cherche par auth_id ou par email
  const isEmailSearch = value.includes('@')

  let query = supabase
    .schema('education')
    .from('users')
    .select('*')

  if (isEmailSearch) {
    // Recherche par email
    query = query.or(`email.eq.${value},secondary_email.eq.${value}`)
  } else {
    // Recherche par auth_id
    // eslint-disable-next-line max-len
    query = query.or(`auth_id_email.eq.${value},auth_id_gmail.eq.${value},parent2_auth_id_email.eq.${value},parent2_auth_id_gmail.eq.${value}`)
  }

  if (isAdminRole) {
    // Pour les rôles admin, chercher dans tous les rôles admin
    query = query.in('role', adminRoles)
  } else {
    // Pour les autres rôles, chercher exactement le rôle spécifié
    query = query.eq('role', role)
  }

  const { data, error } = await query.maybeSingle()

  if (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', error)
    return { error }
  }

  return { data }
}

async function userUpdate(
  supabase: SupabaseClient,
  data_from_auth: {
    id: string
    email?: string
  },
  user_from_education: {
    id: string
    firstname: string
    lastname: string
    role: string
    email: string
    secondary_email: string | null
  },
) {
  const { error: updateUserError } = await supabase.auth.updateUser({
    data: {
      firstname: user_from_education.firstname,
      lastname: user_from_education.lastname,
      role: user_from_education.role,
    },
  })

  if (updateUserError) {
    console.error('Erreur lors de la mise à jour de l\'utilisateur:', updateUserError)
    redirect('/error')
  }

  // Déterminer quel champ mettre à jour selon l'email
  if (!data_from_auth.email) {
    console.error('Email manquant pour la mise à jour')
    redirect('/error')
  }

  const originalEmail = getOriginalEmail(data_from_auth.email)

  // Utilisateur principal
  if (originalEmail.toLowerCase() === user_from_education.email.toLowerCase()) {
    const { error: updateEducationUserError } = await supabase
      .schema('education')
      .from('users')
      .update({ auth_id_gmail: data_from_auth.id })
      .eq('id', user_from_education.id)

    if (updateEducationUserError) {
      console.error('Erreur lors de la mise à jour de education.users:', updateEducationUserError)
      redirect('/error')
    }
  }
  // Parent 2
  else if (
    originalEmail.toLowerCase() === user_from_education.secondary_email?.toLowerCase()) {

    const { error: updateEducationUserError } = await supabase
      .schema('education')
      .from('users')
      .update({ parent2_auth_id_gmail: data_from_auth.id })
      .eq('id', user_from_education.id)

    if (updateEducationUserError) {
      console.error('Erreur lors de la mise à jour de education.users:', updateEducationUserError)
      redirect('/error')
    }
  }

  const redirectUrl = getRedirectUrl(user_from_education.role)
  redirect(redirectUrl)
}
