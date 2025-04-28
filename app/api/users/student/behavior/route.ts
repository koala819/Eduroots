import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import { Behavior } from '@/backend/models/behavior.model'

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')
  // console.log('\n\n\nsessionId', sessionId, '\n\n\n')

  try {
    await dbConnect()

    let behaviorRecords

    if (sessionId) {
      // Récupérer un comportement spécifique
      behaviorRecords = await Behavior.find({ _id: sessionId })
        .populate('teacher')
        .populate('students._id')
        .lean()
    } else {
      // Récupérer toutes les présences
      behaviorRecords = await Behavior.find({})
    }

    // console.log('\n\n\nbehaviors', behaviorRecords)

    return NextResponse.json({
      status: 200,
      data: behaviorRecords,
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
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  try {
    await dbConnect()

    const body = await req.json()
    // console.log('\n\n\nbody', body, '\n\n\n')
    const { students, teacher, session, date } = body
    // console.log('\n\n\nstudents', students)
    // console.log('teacher', teacher)
    // console.log('session', session)

    const ratingRecord = new Behavior({
      date,
      teacher,
      students,
      session,
    })

    await ratingRecord.save()

    return NextResponse.json({
      status: 200,
      message: 'Notes enregistrées avec succès',
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}

export async function PUT(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  const body = await req.json()
  const { behaviorId, updatedStudents } = body
  // console.log(
  //   '\n\n\nupdatedStudents',
  //   updatedStudents,
  //   '\n and behaviorId',
  //   behaviorId,
  // )

  if (!behaviorId) {
    return NextResponse.json({
      status: 400,
      message: 'Behavior ID is required',
    })
  }

  try {
    await dbConnect()

    const updatedAttendance = await Behavior.findByIdAndUpdate(
      behaviorId,
      { $set: { students: updatedStudents } },
      { new: true },
    )

    if (!updatedAttendance) {
      return NextResponse.json({
        status: 404,
        message: 'Behavior record not found',
      })
    }

    return NextResponse.json({
      status: 200,
      message: 'Behavior updated successfully',
      data: updatedAttendance,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
