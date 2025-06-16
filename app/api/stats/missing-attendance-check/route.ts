import { NextResponse } from 'next/server'
import { generateDateRanges, getSessionServer } from '@/server/utils/server-helpers'

type TeacherCourseWithSessions = {
  course_id: string
  courses: {
    id: string
    is_active: boolean
    courses_sessions: {
      id: string
      subject: string
      level: string
      courses_sessions_timeslot: {
        day_of_week: string
        start_time: string
        end_time: string
      }[]
    }[]
  }
}

async function validateTeacher(supabase: any, teacherId: string) {
  const { data: teacher, error: teacherError } = await supabase
    .schema('education')
    .from('users')
    .select('*')
    .eq('id', teacherId)
    .eq('role', 'teacher')
    .single()

  if (teacherError || !teacher) {
    throw new Error('Teacher not found')
  }
  return teacher
}

async function getTeacherCourses(supabase: any, teacherId: string) {
  const { data: teacherCourses, error: coursesError } = await supabase
    .schema('education')
    .from('courses_teacher')
    .select(`
      course_id,
      courses!inner (
        id,
        is_active,
        courses_sessions!inner (
          id,
          subject,
          level,
          courses_sessions_timeslot!inner (
            day_of_week,
            start_time,
            end_time
          )
        )
      )
    `)
    .eq('teacher_id', teacherId) as { data: TeacherCourseWithSessions[] | null, error: any }

  if (coursesError) throw coursesError
  return teacherCourses
}

async function getExistingAttendances(supabase: any, courseId: string, startDate: Date, endDate: Date): Promise<Set<string>> {
  const { data: attendances, error: attendancesError } = await supabase
    .schema('education')
    .from('attendances')
    .select('*')
    .eq('course_id', courseId)
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .eq('is_active', true)
    .is('deleted_at', null)

  if (attendancesError) throw attendancesError
  return new Set(attendances.map((a: { date: string }) => a.date.split('T')[0]))
}

function calculateMissingDates(weekPeriods: any[], dayOfWeek: number, endDate: Date, attendanceDates: Set<string>) {
  return weekPeriods
    .map((period) => {
      const expectedDate = new Date(period.start)
      expectedDate.setDate(
        expectedDate.getDate() + ((dayOfWeek - expectedDate.getDay() + 7) % 7),
      )
      return expectedDate <= endDate ? expectedDate.toISOString().split('T')[0] : null
    })
    .filter((date) => date && !attendanceDates.has(date))
}

export async function GET(req: Request) {
  try {
    const { supabase } = await getSessionServer()
    const { searchParams } = new URL(req.url)
    const teacherId = searchParams.get('teacherId')

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

    await validateTeacher(supabase, teacherId)

    const endDate = new Date()
    const numWeeks = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000),
    )
    const weekPeriods = generateDateRanges(startDate, numWeeks)

    const teacherCourses = await getTeacherCourses(supabase, teacherId)
    const missingAttendances = []

    for (const teacherCourse of teacherCourses || []) {
      for (const session of teacherCourse.courses.courses_sessions) {
        const timeslot = session.courses_sessions_timeslot[0]
        const dayOfWeek = timeslot.day_of_week === 'SATURDAY' ? 6 : 0

        const attendanceDates = await getExistingAttendances(supabase, teacherCourse.course_id, startDate, endDate)
        const missingDates = calculateMissingDates(weekPeriods, dayOfWeek, endDate, attendanceDates)

        if (missingDates.length > 0) {
          missingAttendances.push({
            session: {
              id: session.id,
              level: session.level,
              sessionTime: `${timeslot.day_of_week} ${timeslot.start_time}-${timeslot.end_time}`,
            },
            missingDates,
          })
        }
      }
    }

    return NextResponse.json({
      status: 200,
      data: missingAttendances,
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
