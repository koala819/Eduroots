import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { NextResponse } from 'next/server'



export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role')
  const code = searchParams.get('code')
  const error = searchParams.get('error')
  const errorDescription = searchParams.get('error_description')

  // console.log('Google Auth - Paramètres reçus:', {
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
  if (!data_from_auth) {
    redirect('/error')
  }

  const { data: find_user_in_education_users, error: findError } =
    await findUserInDatabase(supabase, data_from_auth.email!, role!)

  if (findError) {
    return NextResponse.redirect(
      new URL('/error?message=Erreur lors de la vérification du compte', request.url),
    )
  }

  if (!find_user_in_education_users) {
    return NextResponse.redirect(
      new URL(
        `/link-account?email=${encodeURIComponent(data_from_auth.email!)}
        &provider=google&auth_id=${data_from_auth.id}&role=${role}`,
        request.url,
      ),
    )
  }

  await handleUserUpdate(supabase, data_from_auth, find_user_in_education_users)
  redirect(`/${find_user_in_education_users.role}`)
}


async function handleUserUpdate(
  supabase: any,
  data_from_auth: any,
  find_user_in_education_users: any,
) {
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
    console.error('Erreur lors de la mise à jour de education.users:', updateEducationUserError)
    redirect('/error')
  }
}

async function findUserInDatabase(supabase: any, email: string, role: string) {
  const { data, error } = await supabase
    .schema('education')
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('role', role)
    .maybeSingle()

  if (error) {
    console.error('Erreur lors de la recherche de l\'utilisateur:', error)
    return { error }
  }

  return { data }
}
