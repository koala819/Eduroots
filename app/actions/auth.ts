'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/db'
import { UserRoleEnum } from '@/types/user'
import { FormSchema } from '@/lib/validation/login-schema'
import { compare } from 'bcryptjs'

type User = Database['public']['Tables']['users']['Row']
type ConnectionLog = Database['public']['Tables']['connection_logs']['Row']
type ConnectionLogInsert = Database['public']['Tables']['connection_logs']['Insert']

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

    // Création du log initial
    const logData: ConnectionLogInsert = {
      user_id: null,
      email,
      role,
      firstname: null,
      lastname: null,
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

    // Recherche de l'utilisateur
    let userQuery = supabase
      .from('profiles')
      .select('id, email, password_hash, role, firstname, lastname')
      .eq('email', email)

    if (role === UserRoleEnum.Admin) {
      // Si le rôle est 'admin', chercher un utilisateur avec le rôle 'admin' ou 'bureau'
      userQuery = userQuery.in('role', [UserRoleEnum.Admin, UserRoleEnum.Bureau])
    } else {
      // Pour tous les autres rôles, utiliser la recherche exacte
      userQuery = userQuery.eq('role', role)
    }

    const { data: user, error: userError } = await userQuery.single()

    if (userError || !user) {
      console.error('User not found:', userError)
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }
    }

    // Vérification du mot de passe
    const isMatch = await compare(pwd, user.password_hash)

    if (!isMatch) {
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }
    }

    // Vérification du mot de passe par défaut
    const defaultPwd = checkDefaultPassword({
      role: user.role as UserRoleEnum,
      password: user.password_hash,
    })

    if (defaultPwd) {
      return {
        success: true,
        forcePasswordChange: true,
        redirectUrl: '/rstPwd?forceChange=true',
        message: 'Veuillez changer votre mot de passe pour des raisons de sécurité',
      }
    }

    // Préparer les données utilisateur
    const userData = {
      id: user.id,
      email: user.email,
      role: user.role,
      firstname: user.firstname,
      lastname: user.lastname,
    }

    // Mise à jour du log avec succès
    if (log) {
      await supabase
        .schema('logs')
        .from('connection_logs')
        .update({
          user_id: user.id,
          firstname: user.firstname,
          lastname: user.lastname,
          is_successful: true,
        })
        .eq('id', log.id)
    }

    return {
      success: true,
      status: 200,
      message: 'Connection successful',
      user: userData,
    }
  } catch (error: any) {
    console.error('Login error:', error)
    return {
      success: false,
      error: error.name || 'UnknownError',
      message: error.message || 'Une erreur est survenue',
    }
  }
}

function checkDefaultPassword(user: {role: UserRoleEnum; password: string}): boolean {
  if (user.role === 'teacher' && user.password === process.env.TEACHER_PWD) {
    return true
  } else if (user.role === 'student' && user.password === process.env.STUDENT_PWD) {
    return true
  }
  return false
}
