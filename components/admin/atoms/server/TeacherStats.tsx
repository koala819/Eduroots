import { Course } from '@/types/mongo/course'

import { TeacherStatsClient } from '@/components/admin/atoms/client/TeacherStats'

import { getTeacherCourses } from '@/app/actions/context/courses'

export async function TeacherStatsServer({ teacherId }: {teacherId: string}) {
  const response = await getTeacherCourses(teacherId)

  if (!response.success || !response.data) {
    return null
  }

  const courses = response.data as unknown as Course[]

  let sessionCount = 0
  const uniqueStudents = new Set()
  let totalAttendance = 0
  let totalSuccess = 0
  let attendanceCount = 0
  let successCount = 0

  courses.forEach((course) => {
    course.sessions.forEach((session) => {
      sessionCount++

      session.students.forEach((student) => {
        uniqueStudents.add(student.id)
      })

      if (session.stats) {
        if (session.stats.averageAttendance !== undefined) {
          totalAttendance += session.stats.averageAttendance
          attendanceCount++
        }
        if (session.stats.averageGrade !== undefined) {
          totalSuccess += session.stats.averageGrade
          successCount++
        }
      }
    })
  })

  const attendanceRate = attendanceCount > 0 ? Math.round(totalAttendance / attendanceCount) : 0

  const averageStudentSuccess = successCount > 0 ? Math.round(totalSuccess / successCount) : 0

  const stats = {
    studentCount: uniqueStudents.size,
    courseCount: Math.ceil(sessionCount / 2),
    attendanceRate,
    averageStudentSuccess,
  }

  return <TeacherStatsClient stats={stats} />
}
