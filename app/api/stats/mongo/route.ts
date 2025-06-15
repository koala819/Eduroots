import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/zOLDbackend/config/dbConnect'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  try {
    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

    if (!token || !token.user) {
      return NextResponse.json({
        statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
        status: 401,
      })
    }

    await dbConnect()
    const db = mongoose.connection.db
    const stats = await db?.stats()

    if (stats) {
      return NextResponse.json(
        {
          storageSize: stats.storageSize,
          dataSize: stats.dataSize,
          freeStorageSize: stats.fileSize - stats.storageSize,
          usedStorageSize: stats.storageSize,
        },
        { status: 200 },
      )
    }
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
