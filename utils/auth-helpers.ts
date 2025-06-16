import { createClient } from '@/utils/supabase/server'
import { User } from '@supabase/supabase-js'

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

export async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return user
}

/**
 * Récupère l'ID de l'utilisateur dans education.users en vérifiant auth_id et parent2_auth_id
 */
export async function getEducationUserId(authUserId: string): Promise<string | null> {
  const supabase = await createClient()

  const { data: user, error } = await supabase
    .schema('education')
    .from('users')
    .select('id')
    .or(`auth_id.eq.${authUserId},parent2_auth_id.eq.${authUserId}`)
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
