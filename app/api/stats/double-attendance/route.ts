import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {Attendance} from '@/backend/models/attendance.model'
import {generateWeekPeriods} from '@/lib/api.utils'

export async function GET(req: NextRequest) {
  const token = await getToken({req, secret: process.env.NEXTAUTH_SECRET})

  if (!token || !token.user) {
    return NextResponse.json({
      statusText: "Identifiez-vous d'abord pour accéder à cette ressource",
      status: 401,
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

    const endDate = new Date()

    // Calcul du nombre de semaines entre startDate et endDate
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )

    const weekPeriods = generateWeekPeriods(startDate, numWeeks)

    const result = await Attendance.aggregate([
      {
        $addFields: {
          weekPeriod: {
            $switch: {
              branches: weekPeriods.map((period) => ({
                case: {
                  $and: [
                    {$gte: ['$date', period.start]},
                    {
                      $lt: ['$date', new Date(period.end.getTime() + 86400000)],
                    }, // Ajoute un jour pour inclure la fin de la période
                  ],
                },
                then: period.label,
              })),
              default: 'Other',
            },
          },
        },
      },
      {
        $group: {
          _id: {
            course: '$course',
            date: {
              $dateToString: {format: '%Y-%m-%d', date: '$date'},
            },
            weekPeriod: '$weekPeriod',
          },
          count: {$sum: 1},
          attendances: {$push: '$$ROOT'},
        },
      },
      {
        $match: {
          count: {$gt: 1},
        },
      },
      {
        $unwind: '$attendances',
      },
      {
        $replaceRoot: {newRoot: '$attendances'},
      },
      {
        $sort: {date: 1},
      },
    ])

    return NextResponse.json({
      status: 200,
      data: result,
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
