import { NextResponse } from 'next/server'
import { generateDateRanges, getSessionServer } from '@/server/utils/server-helpers'
import { Database } from '@/types/db'

// Type de base pour une présence
type BaseAttendance = Database['education']['Tables']['attendances']['Row'] & {
  attendance_records: Database['education']['Tables']['attendance_records']['Row'][]
}

// Type étendu avec les champs supplémentaires
type AttendanceWithPeriod = BaseAttendance & {
  weekPeriod: string
  formattedDate: string
}


export async function GET() {
  try {
    const { supabase } = await getSessionServer()

    const startDateString = process.env.START_YEAR
    if (!startDateString) {
      throw new Error('START_YEAR environment variable is not defined')
    }

    const startDate = new Date(startDateString)
    if (isNaN(startDate.getTime())) {
      throw new Error('Invalid START_YEAR format in environment variable')
    }

    const endDate = new Date()
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )

    const weekPeriods = generateDateRanges(startDate, numWeeks)

    // Récupérer les présences avec leurs enregistrements
    const { data: attendances, error: attendancesError } = await supabase
      .schema('education')
      .from('attendances')
      .select(`
        *,
        attendance_records (*)
      `)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .eq('is_active', true)
      .is('deleted_at', null)
      .order('date', { ascending: true })

    if (attendancesError) throw attendancesError

    // Ajouter le weekPeriod à chaque présence
    const attendancesWithWeekPeriod = attendances.map((attendance) => {
      const date = new Date(attendance.date)
      const weekPeriod = weekPeriods.find(
        (period) => date >= period.start && date < new Date(period.end.getTime() + 86400000),
      )?.label ?? 'Other'

      return {
        ...attendance,
        weekPeriod,
        formattedDate: date.toISOString().split('T')[0],
      } as AttendanceWithPeriod
    })

    // Grouper les présences
    const groupedAttendances = attendancesWithWeekPeriod.reduce<Record<string, AttendanceWithPeriod[]>>((acc, attendance) => {
      const key = `${attendance.course_id}_${attendance.formattedDate}_${attendance.weekPeriod}`
      if (!acc[key]) {
        acc[key] = []
      }
      acc[key].push(attendance)
      return acc
    }, {})

    // Filtrer et formater les résultats comme dans MongoDB
    // Filtrer et formater les résultats comme dans MongoDB
    const duplicates = Object.entries(groupedAttendances)
      .filter(([_, group]) => group.length > 1)
      .map(([key, group]) => ({
        _id: {
          course: group[0].course_id,
          date: group[0].formattedDate,
          weekPeriod: group[0].weekPeriod,
        },
        count: group.length,
        attendances: group,
      }))
      .flatMap((group) => group.attendances)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    return NextResponse.json({
      status: 200,
      data: duplicates,
    })
  } catch (error: any) {
    if (error.message === 'Non authentifié') {
      return NextResponse.json({
        statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
        status: 401,
      })
    }

    return NextResponse.json({
      status: 500,
      message: 'Internal Server Error',
      error: error.message,
    })
  }
}
