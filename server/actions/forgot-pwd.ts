'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'

import { createClient } from '@/server/utils/supabase'


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
    const { data: users, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id, email, role, firstname, lastname, secondary_email')
      .or(`email.eq.${email.toLowerCase()},secondary_email.eq.${email.toLowerCase()}`)
      .eq('role', role)
      .eq('is_active', true)


    if (userError || !users || users.length === 0) {
      return {
        success: true,
        message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation',
      }
    }

    const firstUser = users[0]
    const sendEmail = firstUser.email === email ? firstUser.email : firstUser.secondary_email

    // Créer l'utilisateur dans auth.users
    const { data: authUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: sendEmail,
      email_confirm: true,
      user_metadata: {
        firstname: firstUser.firstname,
        lastname: firstUser.lastname,
        role: firstUser.role,
      },
    })

    if (createError) {
      console.error('Erreur lors de la création de l\'utilisateur:', createError)
      return {
        success: false,
        message: 'Une erreur est survenue',
      }
    }


    // Utilisateur déjà existant
    if (authUser.user === null) {
      await supabase.auth.resetPasswordForEmail(sendEmail, {
        redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}write-new-password`,
      })
      return {
        success: true,
        message: 'Un email de réinitialisation a été envoyé',
      }
    }

    // Si c'est un nouvel utilisateur, mettre à jour education.users
    for (const user of users) {
      if (sendEmail.toLowerCase() === user.email.toLowerCase()) {
        await supabase
          .schema('education')
          .from('users')
          .update({ auth_id_email: authUser.user.id })
          .eq('id', user.id)
      } else if (sendEmail.toLowerCase() === user.secondary_email?.toLowerCase()) {
        await supabase
          .schema('education')
          .from('users')
          .update({ parent2_auth_id_email: authUser.user.id })
          .eq('id', user.id)
      }
    }

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
