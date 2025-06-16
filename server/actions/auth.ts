'use server'

import { createClient } from '@/utils/supabase'
import { Database } from '@/types/db'
import { UserRoleEnum } from '@/types/user'
import { FormSchema } from '@/server/utils/login-schema'
import { createClient as supabaseClient } from '@supabase/supabase-js'

type ConnectionLogInsert =
  Database['logs']['Tables']['connection_logs']['Insert'];

const supabaseAdmin = supabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function loginAction(formData: FormData) {
  const email = formData.get('email') as string
  const pwd = formData.get('pwd') as string
  const userAgent = formData.get('userAgent') as string
  const role = formData.get('role') as UserRoleEnum

  try {
    FormSchema.parse({
      mail: email,
      pwd,
      role,
      userAgent,
    })

    const supabase = await createClient()

    // 1. Vérifier si l'utilisateur existe dans education.users
    const { data: users, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select(
        'id, email, role, firstname, lastname, auth_id, secondary_email, parent2_auth_id',
      )
      .or(
        `email.eq.${email.toLowerCase()},secondary_email.eq.${email.toLowerCase()}`,
      )
      .eq('role', role)
      .eq('is_active', true)
      .limit(1)

    if (userError || !users || users.length === 0) {
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }
    }

    const user = users[0]

    // 2. Créer le log avec les informations de l'utilisateur
    const logData: ConnectionLogInsert = {
      user_id: user.auth_id ?? null,
      email,
      role,
      firstname: user.firstname,
      lastname: user.lastname,
      is_successful: false,
      user_agent: userAgent,
      timestamp: new Date(),
    }

    const { data: log, error: logError } = await supabase
      .schema('logs')
      .from('connection_logs')
      .insert([logData])
      .select()
      .single()

    if (logError) {
      console.error('Error creating connection log:', logError)
    }

    // Déterminer quel auth_id utiliser
    const authId =
      email.toLowerCase() === user.email.toLowerCase()
        ? user.auth_id
        : user.parent2_auth_id

    if (!authId) {
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Compte non lié. Veuillez réinitialiser votre mot de passe',
      }
    }

    // 3. Authentification avec Supabase
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: pwd,
    })

    if (authError) {
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }
    }

    // 4. Mise à jour du log avec succès
    await supabase
      .schema('logs')
      .from('connection_logs')
      .update({
        is_successful: true,
      })
      .eq('id', log.id)

    return {
      success: true,
      status: 200,
      message: 'Connection successful',
      role: user.role,
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.name ?? 'UnknownError',
      message: error.message ?? 'Une erreur est survenue',
    }
  }
}

export async function checkUserExists(email: string, role: string) {
  const rolesInEnglish = {
    enseignant: 'teacher',
    famille: 'student',
    bureau: 'bureau',
  }
  const roleInEnglish = rolesInEnglish[role as keyof typeof rolesInEnglish]
  console.log('roleInEnglish', roleInEnglish)

  const { data: users, error } = await supabaseAdmin
    .schema('education')
    .from('users')
    .select('id, email, role')
    .or(
      `email.eq.${email.toLowerCase()},secondary_email.eq.${email.toLowerCase()}`,
    )
    .eq('role', roleInEnglish)

  if (error) {
    console.error('Erreur Supabase:', error)
    throw new Error('Erreur lors de la vérification de l\'email')
  }

  return {
    exists: users && users.length > 0,
    user: users?.[0],
  }
}
