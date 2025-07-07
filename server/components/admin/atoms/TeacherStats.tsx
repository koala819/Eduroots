import { Suspense } from 'react'

import { TeacherStatsClient } from '@/client/components/admin/atoms/TeacherStats'
import { getTeacherCourses } from '@/server/actions/api/courses'
import Loading from '@/server/components/admin/atoms/Loading'

export async function TeacherStats({
  teacherId,
}: Readonly<{ teacherId: string }>) {
  const response = await getTeacherCourses(teacherId)

  if (!response.success || !response.data) {
    return null
  }

  const courses = response.data

  let sessionCount = 0
  const uniqueStudents = new Set()
  let totalAttendance = 0
  let totalSuccess = 0
  let attendanceCount = 0
  let successCount = 0

  courses.forEach((course) => {
    course.courses_sessions.forEach((session) => {
      sessionCount++

      session.courses_sessions_students.forEach((student) => {
        uniqueStudents.add(student.users.id)
      })

      if (session.stats_average_attendance !== null) {
        totalAttendance += session.stats_average_attendance
        attendanceCount++
      }
      if (session.stats_average_grade !== null) {
        totalSuccess += session.stats_average_grade
        successCount++
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

  return (
    <Suspense fallback={<Loading name="statistiques de l'enseignant" />}>
      <TeacherStatsClient stats={stats} />
    </Suspense>
  )
}
