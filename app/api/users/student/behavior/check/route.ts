import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {Behavior} from '@/backend/models/behavior.model'

export async function GET(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  const teacherId = req.nextUrl.searchParams.get('teacherId')
  const sessionId = req.nextUrl.searchParams.get('sessionId')

  // console.log('\n\n\nteacherId', teacherId, '\nsessionId', sessionId)

  if (!teacherId || !sessionId) {
    return NextResponse.json({
      status: 400,
      message: 'Teacher ID and Session ID are required',
    })
  }

  try {
    await dbConnect()

    const behaviors = await Behavior.find({
      teacher: teacherId,
      session: sessionId,
    }).sort({date: -1})

    // console.log(
    //   `\n\Found ${behaviors.length} behaviors, \nbehaviors: ${behaviors}`,
    // )

    return NextResponse.json({
      status: 200,
      data: behaviors,
    })
  } catch (error: any) {
    console.error('Error fetching behaviors:', error)
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
