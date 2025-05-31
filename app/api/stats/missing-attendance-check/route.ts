import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {Attendance} from '@/backend/models/attendance.model'
import {User} from '@/backend/models/user.model'
import {generateWeekPeriods} from '@/lib/api.utils'

export async function GET(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
    })
  }

  const teacherId = req.nextUrl.searchParams.get('teacherId')

  if (!teacherId) {
    return NextResponse.json({
      status: 400,
      message: 'Teacher ID is required',
    })
  }

  const startDateString = process.env.START_YEAR

  if (!startDateString) {
    throw new Error('START_YEAR environment variable is not defined')
  }

  const startDate = new Date(startDateString)

  if (isNaN(startDate.getTime())) {
    throw new Error('Invalid START_YEAR format in environment variable')
  }

  try {
    await dbConnect()
    // const startDate = new Date('2024-09-07')
    const endDate = new Date()
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const weekPeriods = generateWeekPeriods(startDate, numWeeks)

    const teacher = await User.findById(teacherId)
    if (!teacher || teacher.role !== 'teacher') {
      return NextResponse.json({
        status: 404,
        message: 'Teacher not found',
      })
    }
    const missingAttendances = []

    for (const session of teacher.teacherSessions) {
      const {sessionTime} = session
      const dayOfWeek = sessionTime.includes('Samedi') ? 6 : 0

      const attendances = await Attendance.find({
        teacher: teacher._id,
        session: session._id,
        date: {$gte: startDate, $lte: endDate},
      })

      const attendanceDates = new Set(
        attendances.map((a) => (a.date as any).toISOString().split('T')[0]),
      )

      const missingDates = weekPeriods
        .map((period) => {
          const expectedDate = new Date(period.start)
          expectedDate.setDate(
            expectedDate.getDate() + ((dayOfWeek - expectedDate.getDay() + 7) % 7),
          )
          return expectedDate <= endDate ? expectedDate.toISOString().split('T')[0] : null
        })
        .filter((date) => date && !attendanceDates.has(date))

      if (missingDates.length > 0) {
        missingAttendances.push({
          session: {
            id: session._id,
            level: session.level,
            sessionTime: session.sessionTime,
          },
          missingDates,
        })
      }
    }

    return NextResponse.json({
      status: 200,
      data: missingAttendances,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
