import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import cloudinary from '@/server/utils/cloudinary'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token || !token.user) {
      return NextResponse.json({
        statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
        status: 401,
      })
    }

    const stats = await cloudinary.api.usage()

    return NextResponse.json(stats, { status: 200 })
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
