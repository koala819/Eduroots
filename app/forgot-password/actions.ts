'use server'

import { createClient } from '@/utils/supabase/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'


export async function forgotPassword(formData: FormData, role: string) {
  const email = formData.get('email') as string
  const supabase = await createClient()

  // Créer un client avec la clé de service pour les opérations admin
  const serviceClient = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    },
  )

  try {
    // Vérifier si l'email existe dans education.users
    const { data: user, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id, email, role, firstname, lastname, secondary_email')
      // .eq('email', email)
      .or(`email.eq.${email.toLowerCase()},secondary_email.eq.${email.toLowerCase()}`)
      .eq('role', role)
      .eq('is_active', true)
      .limit(1)


    if (userError || !user || user.length === 0) {
      return {
        success: true,
        message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation',
      }
    }

    const sendEmail = user[0].email === email ? user[0].email : user[0].secondary_email

    // Créer l'utilisateur dans auth.users
    await serviceClient.auth.admin.createUser({
      email: sendEmail,
      email_confirm: true,
      user_metadata: {
        firstname: user[0].firstname,
        lastname: user[0].lastname,
        role: user[0].role,
      },
    })

    // 2. Envoyer l'email de réinitialisation
    await supabase.auth.resetPasswordForEmail(
      sendEmail,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}write-new-password`,
      })


    return {
      success: true,
      message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation',
    }
  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error)
    return {
      success: false,
      message: 'Une erreur est survenue',
    }
  }
}
