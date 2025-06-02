import {NextRequest, NextResponse} from 'next/server'

import {AttendanceRecord} from '@/types/attendance'

import {Attendance} from '@/zOLDbackend/models/zOLDattendance.model'
import {validateRequest} from '@/lib/api.utils'

export async function GET(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const attendances = await Attendance.find({isActive: true})
    const totalSessions = attendances.length
    let totalPresences = 0
    let totalStudents = 0

    attendances.forEach((attendance: any) => {
      totalStudents += attendance.records.length
      totalPresences += attendance.records.filter((r: AttendanceRecord) => r.isPresent).length
    })

    return NextResponse.json({
      status: 200,
      data: {
        presenceRate: totalStudents > 0 ? (totalPresences / totalStudents) * 100 : 0,
        totalStudents: totalStudents / (totalSessions || 1), // moyenne d'étudiants par session
        lastUpdate: new Date(),
      },
    })
  } catch (error: any) {
    return NextResponse.json({
      status: 500,
      message: error.message,
    })
  }
}
