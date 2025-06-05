// app/auth/callback/route.ts
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
  const role = searchParams.get('role')

  if (code) {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    const data_from_auth = data.user

    if (!error && data_from_auth) {

      // Vérifier si l'email existe dans education.users
      const { data: find_user_in_education_users } = await supabase
        .schema('education')
        .from('users')
        .select('id, role, firstname, lastname')
        .eq('email', data_from_auth.email)
        .single()

      if (find_user_in_education_users) {
        await supabase.auth.updateUser({
          data: {
            firstname: find_user_in_education_users.firstname,
            lastname: find_user_in_education_users.lastname,
          },
        })

        const { error: profileError } = await supabase
          .schema('public')
          .from('profiles')
          .upsert({
            id: data_from_auth.id,
            education_user_id: find_user_in_education_users.id,
            firstname: find_user_in_education_users.firstname,
            lastname: find_user_in_education_users.lastname,
            role: find_user_in_education_users.role,
            email: data_from_auth.email,
          })
          .eq('id', data_from_auth.id)

        if (profileError) {
          console.error('Error updating profile:', profileError)
        }
        const redirectPath = getRedirectUrl(find_user_in_education_users.role)
        redirect(redirectPath)


        // console.log('redirection vers link-account avec le role', role,
        //   'et l\'email', data_from_auth.email)
        // const email = encodeURIComponent(data_from_auth.email || '')
        // const roleParam = encodeURIComponent(role || '')
        // redirect(`/link-account?email=${email}&role=${roleParam}`)
      }
    }
  }

  redirect('/error')
}
