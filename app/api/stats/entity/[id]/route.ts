import {NextRequest, NextResponse} from 'next/server'

import {StudentStats} from '@/backend/models/student-stats.model'
import {TeacherStats} from '@/backend/models/teacher-stats.model'
import {validateRequest} from '@/lib/api.utils'
import {isValidObjectId} from 'mongoose'

type Params = Promise<{ id: string }>


export async function PATCH(req: NextRequest, {params}: {params: Params}) {
  const { id } = await params;

  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    if (!isValidObjectId(id)) {
      return NextResponse.json({message: 'Invalid ID', status: 400})
    }

    const body = await req.json()
    const {entityType, statsData} = body

    // Validation du type d'entité
    if (!['student', 'teacher'].includes(entityType)) {
      return NextResponse.json({message: 'Invalid entity type', status: 400})
    }

    let stats = null

    // Mise à jour des stats selon le type
    if (entityType === 'student') {
      // Validation des statsData pour un étudiant
      const requiredFields = ['attendanceRate', 'totalAbsences', 'behaviorAverage']
      if (!requiredFields.every((field) => field in statsData)) {
        return NextResponse.json({
          message: 'Missing required fields for student stats',
          status: 400,
        })
      }

      stats = await StudentStats.findOneAndUpdate(
        {userId: id},
        {
          $set: {
            ...statsData,
            lastUpdate: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
    } else {
      // Validation des statsData pour un professeur
      const requiredFields = ['attendanceRate', 'totalSessions']
      if (!requiredFields.every((field) => field in statsData)) {
        return NextResponse.json({
          message: 'Missing required fields for teacher stats',
          status: 400,
        })
      }

      stats = await TeacherStats.findOneAndUpdate(
        {userId: id},
        {
          $set: {
            ...statsData,
            lastUpdate: new Date(),
          },
        },
        {
          new: true,
          runValidators: true,
        },
      )
    }

    if (!stats) {
      return NextResponse.json({message: 'Stats not found', status: 404})
    }

    return NextResponse.json({data: stats, status: 200})
  } catch (error: any) {
    console.error('[ENTITY_STATS_PATCH]', error)
    if (error.name === 'ValidationError') {
      return NextResponse.json({message: 'Validation Error', status: 400})
    }
    return NextResponse.json({message: 'Internal Error', status: 500})
  }
}
