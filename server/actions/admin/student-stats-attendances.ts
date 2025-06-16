'use server'

import { Attendance } from '@/zUnused/types/attendance'
import { SubjectNameEnum } from '@/zUnused/types/course'

import { getStudentAttendanceHistory } from '@/server/actions/context/attendances'

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

export async function fetchStudentAttendanceStats(
  studentId: string,
): Promise<CalculatedStats | null> {
  try {
    const response = await getStudentAttendanceHistory(studentId)

    if (!response.success) {
      throw new Error(response.message || 'Failed to fetch attendance history')
    }

    const attendanceHistory = response.data

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
      ;(attendanceHistory as unknown as Attendance[]).forEach((attendance: Attendance) => {
        const studentRecord = attendance.records.find((record) => {
          if (!record.student) return false
          const recordStudentId =
            typeof record.student === 'string' ? record.student : record.student.id
          return recordStudentId === studentId
        })

        if (
          studentRecord &&
          typeof studentRecord.student !== 'string' &&
          studentRecord.student.subjects
        ) {
          const formattedDate = new Date(attendance.date).toLocaleDateString('fr-FR', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
          stats.totalSessions++
          stats.dates.push(formattedDate)

          // On ajoute une seule entrée par date et par matière
          const subjects = studentRecord.student.subjects as SubjectNameEnum[]
          subjects.forEach((subject) => {
            // Vérifier si cette combinaison date/matière existe déjà
            const existingAbsenceEntry = stats.absenceDates.find(
              (item) => item.date === formattedDate && item.subject === subject,
            )
            const existingPresenceEntry = stats.presentDates.find(
              (item) => item.date === formattedDate && item.subject === subject,
            )

            if (!existingAbsenceEntry && !existingPresenceEntry) {
              if (studentRecord.isPresent) {
                stats.presentDates.push({
                  date: formattedDate,
                  subject: subject,
                })
              } else {
                stats.absenceDates.push({
                  date: formattedDate,
                  subject: subject,
                })
              }
            }
          })

          // On ne compte qu'une fois pour les stats globales
          if (studentRecord.isPresent) {
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
