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
      .select('id, email, role, firstname, lastname')
      .eq('email', email)
      // .or(`email.eq.${email.toLowerCase()},secondary_email.eq.${email.toLowerCase()}`)
      .eq('role', role)
      .eq('is_active', true)
      .limit(1)

    console.log('user', user)

    if (userError || !user || user.length === 0) {
      return {
        success: true,
        message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation',
      }
    }

    // Créer l'utilisateur dans auth.users
    const { data: newAuthUser, error: createError } = await serviceClient.auth.admin.createUser({
      email: user[0].email,
      email_confirm: true,
      user_metadata: {
        firstname: user[0].firstname,
        lastname: user[0].lastname,
        role: user[0].role,
      },
    })

    // 2. Envoyer l'email de réinitialisation
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${process.env.NEXT_PUBLIC_CLIENT_URL}write-new-password`,
      })

    console.log('resetError', resetError)


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

// const user = users[0]

// // Vérifier si l'utilisateur existe dans auth.users
// const { data: authData, error: authError } = await serviceClient.auth
//   .signInWithOtp({ email: email as string, options: { shouldCreateUser: false } })

// if (authError?.message?.includes('User not found')) {
//   // Créer l'utilisateur avec la clé de service
//   const { data: newAuthUser, error: createError } =
//  await serviceClient.auth.admin.createUser({
//     email: user.email,
//     email_confirm: true,
//     user_metadata: {
//       firstname: user.firstname,
//       lastname: user.lastname,
//       role: user.role,
//     },
//   })

//   if (createError) {
//     console.error('Erreur lors de la création de l\'utilisateur auth:', createError)
//     return {
//       success: false,
//       message: 'Une erreur est survenue lors de la création du compte',
//     }
//   }

//   // Mettre à jour l'auth_id
//   const { error: updateError } = await supabase
//     .schema('education')
//     .from('users')
//     .update({ auth_id: newAuthUser.user.id })
//     .eq('id', user.id)

//   if (updateError) {
//     console.error('Erreur lors de la mise à jour de l\'auth_id:', updateError)
//     return {
//       success: false,
//       message: 'Une erreur est survenue lors de la mise à jour du compte',
//     }
//   }
// }

//     // Envoyer l'email de réinitialisation
//     const { error: resetError } = await supabase.auth.resetPasswordForEmail(email as string)

//     if (resetError) {
//       console.error('Erreur lors de l\'envoi du mail:', resetError)
//       return {
//         success: false,
//         message: 'Une erreur est survenue lors de l\'envoi du mail',
//       }
//     }

//     return {
//       success: true,
//       message: 'Si votre email est enregistré, vous recevrez un lien de réinitialisation',
//     }
//   } catch (error) {
//     console.error('Erreur lors de la réinitialisation du mot de passe:', error)
//     return {
//       success: false,
//       message: 'Une erreur est survenue',
//     }
//   }
// }
