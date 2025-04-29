import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {User} from '@/backend/models/user.model'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    await dbConnect()

    const {email, pwd} = await req.json()

    if (!email || !pwd) {
      return NextResponse.json({
        statusText: 'Email et mot de passe actuel sont requis',
        status: 400,
      })
    }

    const userExists = await User.findOne({email}).select('+password')
    // console.log('userExists', userExists)
    if (!userExists) {
      return NextResponse.json({
        statusText: 'Aucun utilisateur trouvé avec cet email',
        status: 404,
      })
    }

    const isPasswordValid = await bcrypt.compare(pwd, userExists.password)
    // console.log('isPasswordValid', isPasswordValid)
    if (!isPasswordValid) {
      return NextResponse.json({
        statusText: 'Mot de passe incorrect',
        status: 400,
      })
    }

    return NextResponse.json({exists: !!userExists}, {status: 200})
  } catch (error) {
    console.error("Erreur lors de la vérification de l'email:", error)
    return NextResponse.json({
      statusText: "Erreur lors de la vérification de l'email",
      status: 500,
    })
  }
}
