import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import { AppConfigDocument } from '@/types/mongo/models'

import dbConnect from '@/zOLDbackend/config/dbConnect'
import { AppConfig } from '@/backend/models/appConfig'
import bcrypt from 'bcryptjs'

const ADMIN_ROLES = ['admin', 'bureau']

export async function GET() {
  try {
    await dbConnect()

    const config = (await AppConfig.findOne()
      .select('+studentPassword +teacherPassword')
      .lean()
      .exec()) as (AppConfigDocument & {_id: unknown; _v: number}) | null
    // .lean()) as AppConfigDocument

    // console.log('config', config)

    if (!config) {
      return NextResponse.json({
        status: 404,
        message: 'Configuration not found',
      })
    }

    const safeConfig: Partial<AppConfigDocument> = {
      ...config,
      studentPassword: config.studentPassword ? '[DÉFINI]' : '',
      teacherPassword: config.teacherPassword ? '[DÉFINI]' : '',
    }
    // console.log('safeConfig', safeConfig)

    return NextResponse.json({
      status: 200,
      data: safeConfig,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}

export async function POST(req: NextRequest) {
  if (!(await checkAdminAccess(req))) {
    return NextResponse.json({
      statusText: 'Accès non autorisé',
      status: 403,
    })
  }

  try {
    await dbConnect()
    const body = await req.json()

    await handleConfigUpdate(body, true)

    return NextResponse.json({
      status: 200,
      statusText: 'Configuration saved successfully',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Error saving configuration',
      error: error.message,
    })
  }
}

export async function PUT(req: NextRequest) {
  if (!(await checkAdminAccess(req))) {
    return NextResponse.json(
      {
        statusText: 'Accès non autorisé',
        status: 403,
      },
      { status: 403 },
    )
  }
  try {
    await dbConnect()
    const body = await req.json()
    const updatedConfig = await handleConfigUpdate(body, false)

    return NextResponse.json({
      status: 200,
      statusText: 'Configuration updated successfully',
      data: updatedConfig,
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        status: 500,
        message: 'Error updating configuration',
        error: error.message,
      },
      { status: 500 },
    )
  }
}
async function checkAdminAccess(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return false
  }
  const userRole = (token.user as {role?: string})?.role
  if (!userRole) {
    return false
  }
  return ADMIN_ROLES.includes(userRole)
}

async function handleConfigUpdate(body: any, isNewConfig: boolean) {
  const { studentPassword, teacherPassword, ...restOfBody } = body
  const updateData: any = { ...restOfBody }

  // Traitement des mots de passe si nécessaire
  if (studentPassword && studentPassword !== '[DÉFINI]') {
    updateData.studentPassword = await bcrypt.hash(studentPassword, 10)
  }
  if (teacherPassword && teacherPassword !== '[DÉFINI]') {
    updateData.teacherPassword = await bcrypt.hash(teacherPassword, 10)
  }

  // Assurez-vous que la structure des thèmes est correcte
  ;['teacher', 'student', 'bureau'].forEach((userType) => {
    if (updateData.themes && updateData.themes[userType]) {
      const theme = updateData.themes[userType]

      // Assurez-vous que buttonVariants est un objet
      if (typeof theme.buttonVariants !== 'object') {
        theme.buttonVariants = {}
      }

      // Renommez les champs spécifiques si nécessaire
      if (theme[`${userType}CardHeader`]) {
        theme.cardHeader = theme[`${userType}CardHeader`]
        delete theme[`${userType}CardHeader`]
      }
      if (theme[`${userType}Loader`]) {
        theme.loader = theme[`${userType}Loader`]
        delete theme[`${userType}Loader`]
      }

      // Supprimez le champ 'loaders' s'il existe
      delete theme.loaders
    }
  })

  let updatedConfig
  if (isNewConfig) {
    updatedConfig = await AppConfig.create(updateData)
  } else {
    updatedConfig = await AppConfig.findOneAndUpdate({}, updateData, {
      new: true,
      upsert: true,
      runValidators: true,
    })
  }

  if (!updatedConfig) {
    throw new Error('Failed to update configuration')
  }

  // Ne pas renvoyer les mots de passe dans la réponse
  const {
    studentPassword: _,
    teacherPassword: __,
    ...configWithoutPasswords
  } = updatedConfig.toObject()

  return configWithoutPasswords
}
