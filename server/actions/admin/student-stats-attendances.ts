'use server'

import { Attendance, AttendanceRecord } from '@/types/db'
import { getStudentAttendanceHistory } from '@/server/actions/api/attendances'
import { SubjectNameEnum } from '@/types/courses'

export interface CalculatedStats {
  totalSessions: number
  presentCount: number
  absentCount: number
  presenceRate: number
  totalStudents: number
  lastUpdate: Date
  dates: string[]
  absenceDates: {date: string; subject: SubjectNameEnum}[]
  presentDates: {date: string; subject: SubjectNameEnum}[]
}

interface AttendanceWithRecords extends Attendance {
  attendance_records: (AttendanceRecord & {
    course_session?: {
      subject: SubjectNameEnum
    }
  })[]
}

export async function fetchStudentAttendanceStats(
  studentId: string,
): Promise<CalculatedStats | null> {
  try {
    const response = await getStudentAttendanceHistory(studentId)

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch attendance history')
    }

    const attendanceHistory = response.data as AttendanceWithRecords[]

    const stats: CalculatedStats = {
      totalSessions: 0,
      presentCount: 0,
      absentCount: 0,
      presenceRate: 0,
      totalStudents: 1,
      lastUpdate: new Date(),
      dates: [],
      absenceDates: [],
      presentDates: [],
    }
    if (attendanceHistory) {
      attendanceHistory.forEach((attendance) => {
        const studentRecord =
          attendance.attendance_records.find((record) => {
            return record.student_id === studentId
          })

        if ( studentRecord ) {
          const formattedDate = new Date(attendance.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          stats.totalSessions++
          stats.dates.push(formattedDate)

          // On ajoute une seule entrée par date et par matière
          const subject = studentRecord.course_session?.subject

          // Vérifier si cette combinaison date/matière existe déjà
          const existingAbsenceEntry = stats.absenceDates.find(
            (item) => item.date === formattedDate && item.subject === subject,
          )
          const existingPresenceEntry = stats.presentDates.find(
            (item) => item.date === formattedDate && item.subject === subject,
          )

          if (!existingAbsenceEntry && !existingPresenceEntry) {
            if (studentRecord.is_present) {
              stats.presentDates.push({
                date: formattedDate,
                subject: subject as SubjectNameEnum,
              })
            } else {
              stats.absenceDates.push({
                date: formattedDate,
                subject: subject as SubjectNameEnum,
              })
            }
          }


          // On ne compte qu'une fois pour les stats globales
          if (studentRecord.is_present) {
            stats.presentCount++
          } else {
            stats.absentCount++
          }
        }
      })
    }

    if (stats.totalSessions > 0) {
      stats.presenceRate = (stats.presentCount / stats.totalSessions) * 100
    }

    // Trier les dates
    stats.dates.sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    stats.absenceDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    stats.presentDates.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    return stats
  } catch (error) {
    console.error('Error fetching student attendance stats:', error)
    return null
  }
}
