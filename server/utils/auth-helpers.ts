import { User } from '@supabase/supabase-js'
import { createClient as createServiceClient } from '@supabase/supabase-js'

import { createClient } from '@/server/utils/supabase'


/**
 * Vérifie si l'utilisateur est authentifié et a un rôle valide
 */
export async function checkUserAuth(
  user: User | null):
  Promise<{ isAuthenticated: boolean; role?: string }> {
  if (!user) {
    return { isAuthenticated: false }
  }

  const role = user.user_metadata?.role
  if (!role) {
    return { isAuthenticated: false }
  }

  return { isAuthenticated: true, role }
}

export function generateSupabaseEmail(email: string, role: string): string {
  const [localPart, domain] = email.split('@')
  return `${localPart}.${role}@${domain}`
}

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return user
}

export function getOriginalEmail(supabaseEmail: string): string {
  return supabaseEmail.replace(/\.(teacher|student|admin|bureau)@/, '@')
}

/**
 * Récupère l'ID de l'utilisateur dans education.users en vérifiant
 *  auth_id_email et auth_id_gmail et parent2_auth_id_email et parent2_auth_id_gmail
 */
export async function getEducationUserId(authUserId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .schema('education')
    .from('users')
    .select('id')
    .or(
      `auth_id_email.eq.${authUserId},auth_id_gmail.eq.${authUserId},` +
      `parent2_auth_id_email.eq.${authUserId},parent2_auth_id_gmail.eq.${authUserId}`,
    )
    .single()

  if (error) {
    console.error('Erreur lors de la récupération de l\'utilisateur:', error)
    return null
  }

  return user?.id ?? null
}

/**
 * Vérifie l'authentification et récupère l'ID education.users en une seule fonction
 */
export async function getAuthenticatedEducationUser(user: User | null): Promise<{
  isAuthenticated: boolean
  role?: string
  educationUserId?: string
  error?: string
}> {
  const { isAuthenticated, role } = await checkUserAuth(user)

  if (!isAuthenticated || !user) {
    return { isAuthenticated: false, error: 'Utilisateur non authentifié' }
  }

  const educationUserId = await getEducationUserId(user.id)

  if (!educationUserId) {
    return {
      isAuthenticated: false,
      error: 'Utilisateur non trouvé dans education.users',
    }
  }

  return {
    isAuthenticated: true,
    role,
    educationUserId,
  }
}

/**
 * Migre un utilisateur vers un email avec suffixe
 */
export async function migrateUserToSuffixedEmail(
  authUserId: string,
  currentEmail: string,
  role: string,
  newPassword: string,
) {
  const supabase = await createClient()

  // Créer un client admin
  const adminClient = createServiceClient(
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
    // 1. Récupérer l'utilisateur dans education.users
    console.log('\n\n\ncurrentEmail', currentEmail)
    console.log('role', role)
    const { data: educationUsers } = await supabase
      .schema('education')
      .from('users')
      .select('*')
      .eq('role', role)
      .or(`email.eq.${currentEmail},secondary_email.eq.${currentEmail}`)

    if (!educationUsers || educationUsers.length === 0) {
      throw new Error('Utilisateur non trouvé dans education.users')
    }

    console.log('Nombre d\'utilisateurs trouvés:', educationUsers.length)

    // 2. Créer le nouvel utilisateur avec suffixe spécifique au role
    const supabaseEmail = generateSupabaseEmail(currentEmail, role)

    const { data: newAuthUser, error: createError } = await adminClient.auth.admin.createUser({
      email: supabaseEmail,
      email_confirm: true,
      password: newPassword,
      user_metadata: {
        firstname: educationUsers[0].firstname, // Prendre le premier pour les métadonnées
        lastname: educationUsers[0].lastname,
        role: educationUsers[0].role,
      },
    })

    if (createError) {
      throw new Error('Erreur lors de la création du nouvel utilisateur')
    }

    // 3. Mettre à jour TOUS les utilisateurs de la fratrie
    for (const educationUser of educationUsers) {
      const isPrimaryUser = currentEmail.toLowerCase() === educationUser.email.toLowerCase()
      const fieldToUpdate = isPrimaryUser ? 'auth_id_email' : 'parent2_auth_id_email'


      console.log(`Mise à jour utilisateur ${educationUser.id} - champ: ${fieldToUpdate}`)

      await supabase
        .schema('education')
        .from('users')
        .update({ [fieldToUpdate]: newAuthUser.user.id })
        .eq('id', educationUser.id)
    }

    // 4. Supprimer l'ancien utilisateur
    await adminClient.auth.admin.deleteUser(authUserId)

    return {
      success: true,
      role: educationUsers[0].role,
    }

  } catch (error: any) {
    console.error('Erreur migration:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}
