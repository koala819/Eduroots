import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/zOLDbackend/config/dbConnect'
import {User} from '@/zOLDbackend/models/zOLDuser.model'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const {email, newPassword} = await req.json()
  // console.log('email', email)
  // console.log('newPassword', newPassword)

  try {
    await dbConnect()

    if (!email || !newPassword) {
      return NextResponse.json({
        statusText: 'Emailet nouveau mot de passe sont requis',
        status: 400,
      })
    }

    if (newPassword.length < 8) {
      return NextResponse.json({
        statusText: 'Le mot de passe doit avoir au moins 8 caractères',
        statusCode: 400,
      })
    }

    const users = await User.find({email})
    // console.log('users', users)

    if (!users) {
      return NextResponse.json({
        statusText: 'Aucun utilisateur trouvé avec cet email',
        statusCode: 404,
      })
    }

    // Hacher le nouveau mot de passe une seule fois
    const hashedPassword = await bcrypt.hash(newPassword, 10)

    // Mettre à jour le mot de passe pour tous les comptes associés à cet email
    await User.updateMany({email}, {password: hashedPassword})

    return NextResponse.json({
      status: 200,
      statusText: 'Mot de passe réinitialisé avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      statusText: error.message,
    })
  }
}
