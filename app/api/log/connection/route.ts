import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {ConnectionLog} from '@/backend/models/connectionLog'
import {Document, Types} from 'mongoose'

interface IConnectionLog extends Document {
  _id: Types.ObjectId
  user: {
    Id: Types.ObjectId
    email: string
    firstname: string
    lastname: string
    role: string
  }
  isSuccessful: boolean
  timestamp: Date
  userAgent: string
}

export async function GET() {
  try {
    await dbConnect()
    const logs = await ConnectionLog.find()
      .sort({timestamp: -1})
      .limit(100) // Limit to the last 100 logs for performance
      .lean<IConnectionLog[]>() // Use lean() for better performance when you don't need Mongoose document methods
      .exec()

    // console.log('logs', logs)
    // Transform the logs to match the expected format
    const transformedLogs = logs.map((log) => ({
      _id: log._id.toString(),
      user: {
        Id: log.user.Id,
        email: log.user.email,
        firstname: log.user.firstname,
        lastname: log.user.lastname,
        role: log.user.role,
      },
      isSuccessful: log.isSuccessful,
      timestamp: log.timestamp.toISOString(),
      userAgent: log.userAgent,
    }))

    return NextResponse.json({
      status: 200,
      logs: transformedLogs,
    })
  } catch (error) {
    console.error('Error fetching connection logs:', error)
    return NextResponse.json({
      status: 500,
      message: 'Error fetching connection logs',
    })
  }
}

export async function POST(req: NextRequest) {
  try {
    await dbConnect()
    const body = await req.json()
    const {user, isSuccessful, userAgent} = body

    const logData = {
      user: {
        _id: null,
        email: user.email,
        firstname: user.firstname || '',
        lastname: user.lastname || '',
        role: user.role,
      },
      isSuccessful,
      userAgent,
    }
    // console.log('\n\n\nlogData', logData)

    const log = new ConnectionLog(logData)

    // console.log('Unsaved log', log)
    await log.save()

    return NextResponse.json({
      status: 200,
      statusText: 'Connection attempt logged',
    })
  } catch (error) {
    console.error('Error logging connection attempt:', error)
    if (error instanceof Error) {
      console.error('Error details:', error.message)
    }
    return NextResponse.json({
      status: 500,
      statusText: 'Error logging connection attempt',
    })
  }
}
