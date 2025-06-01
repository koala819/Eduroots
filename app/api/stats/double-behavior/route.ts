import {getToken} from 'next-auth/jwt'
import {NextRequest, NextResponse} from 'next/server'

import dbConnect from '@/backend/config/dbConnect'
import {Behavior} from '@/backend/models/zOLDbehavior.model'
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
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const weekPeriods = generateWeekPeriods(startDate, numWeeks)

    const result = await Behavior.aggregate([
      {
        // $addFields avec weekPeriod est crucial car :
        // Il permet de grouper les comportements par semaines
        // Il assure une catégorisation temporelle précise
        // Ces périodes sont nécessaires pour l'analyse des doublons
        $addFields: {
          weekPeriod: {
            $switch: {
              branches: weekPeriods.map((period) => ({
                case: {
                  $and: [
                    {$gte: ['$date', period.start]},
                    {
                      $lt: ['$date', new Date(period.end.getTime() + 86400000)],
                    },
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
            weekPeriod: '$weekPeriod',
          },
          count: {$sum: 1},
          behaviors: {$push: '$$ROOT'},
        },
      },
      {
        $match: {
          count: {$gt: 1},
        },
      },
      {
        // $unwind décompose le tableau de behaviors pour un traitement individuel
        $unwind: '$behaviors',
      },
      {
        // $replaceRoot remonte chaque behavior à la racine
        $replaceRoot: {newRoot: '$behaviors'},
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
