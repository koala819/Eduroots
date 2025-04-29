'use server'

import {UserRoleEnum} from '@/types/user'

import dbConnect from '@/backend/config/dbConnect'
import {ConnectionLog} from '@/backend/models/connectionLog'
import {User} from '@/backend/models/user.model'
import {FormSchema} from '@/lib/validation/login-schema'
import {compare} from 'bcryptjs'

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

    await dbConnect()

    // Création du log
    const log = new ConnectionLog({
      user: {
        _id: null,
        email,
        role,
      },
      isSuccessful: false,
      userAgent,
    })
    await log.save()

    // Recherche de l'utilisateur
    let user

    if (role === UserRoleEnum.Admin) {
      // Si le rôle est 'admin', chercher un utilisateur avec le rôle 'admin' ou 'bureau'
      user = await User.findOne({
        email,
        role: {$in: [UserRoleEnum.Admin, UserRoleEnum.Bureau]},
        isActive: true,
      }).select('+password +role')
    } else {
      // Pour tous les autres rôles, utiliser la recherche originale
      user = await User.findOne({email, role, isActive: true}).select('+password +role')
    }

    // Vérification du mot de passe
    const isMatch = await compare(pwd, user.password)

    if (!isMatch) {
      return {
        success: false,
        error: 'CredentialsSignin',
        message: 'Identifiants incorrects. Veuillez réessayer',
      }
    }

    // Vérification du mot de passe par défaut
    const defaultPwd = checkDefaultPassword(user)
    if (defaultPwd) {
      return {
        success: true,
        forcePasswordChange: true,
        redirectUrl: '/rstPwd?forceChange=true',
        message: 'Veuillez changer votre mot de passe pour des raisons de sécurité',
      }
    }

    // IMPORTANT: Convertir les documents MongoDB en objets simples
    // Ne retournez que les données essentielles et pas tout l'objet user
    const userData = {
      _id: user._id.toString(),
      email: user.email,
      role: user.role,
      // Autres propriétés essentielles mais pas le document complet
    }

    // Mise à jour du log
    await ConnectionLog.findOneAndUpdate(
      {'user.email': user.email, isSuccessful: false},
      {
        $set: {
          user: userData, // Utilisez l'objet simplifié ici aussi
          isSuccessful: true,
        },
      },
      {new: true, sort: {timestamp: -1}},
    )

    return {
      success: true,
      status: 200,
      message: 'Connection successful',
      user: userData, // Retournez des données sérialisables
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
