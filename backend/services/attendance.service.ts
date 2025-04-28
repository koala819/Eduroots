import type {
  AttendanceRecord,
  Attendance as AttendanceType,
} from '@/types/attendance'

import { Attendance } from '@/backend/models/attendance.model'

export async function checkAttendance(teacherId: string, sessionId: string) {
  const attendances = await Attendance.find({
    'course.teacher': teacherId,
    'course.sessions': { $elemMatch: { _id: sessionId } },
    isActive: true,
  })
    .populate('records.student')
    .exec()
  return attendances
}

export async function createAttendance(
  attendanceData: Partial<AttendanceType>,
) {
  try {
    const attendance = new Attendance(attendanceData)
    await attendance.save()

    const populatedAttendance = await attendance.populate([
      'course',
      'records.student',
    ])

    return populatedAttendance
  } catch (error: any) {
    if (error.message.includes('date de présence')) {
      throw new Error('Impossible de créer une présence pour une date future')
    }
    throw error
  }
}

export async function deleteAttendance(id: string) {
  const attendance = await Attendance.findByIdAndUpdate(
    id,
    {
      isActive: false,
      deletedAt: new Date(),
      updatedAt: new Date(),
    },
    { new: true },
  )
  if (!attendance) {
    throw new Error('Attendance not found')
  }
  return attendance
}

export async function findAllAttendance(filter: any = { isActive: true }) {
  const attendances = await Attendance.find(filter)
    .populate('course')
    .populate('records.student')
    .exec()
  return attendances
}

export async function findAttendanceByCourse(courseId: string) {
  const attendances = await Attendance.find({
    course: courseId,
    isActive: true,
  })
    .populate('records.student')
    .exec()
  return attendances
}

export async function findAttendanceByCourseAndDate(
  courseId: string,
  date: Date,
) {
  const attendance = await Attendance.findOne({
    course: courseId,
    date: {
      $gte: new Date(date.setHours(0, 0, 0, 0)),
      $lt: new Date(date.setHours(23, 59, 59, 999)),
    },
    isActive: true,
  })
    .populate('course')
    .populate('records.student')
    .exec()

  return attendance
}

export async function findAttendanceById(id: string) {
  const attendance = await Attendance.findById(id)
    .populate('course')
    .populate('records.student')
    .exec()
  return attendance
}

export async function findAttendanceByStudent(studentId: string) {
  const attendances = await Attendance.find({
    'records.student': studentId,
    isActive: true,
  })
    .populate('course')
    .exec()

  return attendances
}

export async function findDuplicateAttendances() {
  const duplicates = await Attendance.aggregate([
    {
      $group: {
        _id: {
          course: '$course',
          date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
        },
        count: { $sum: 1 },
        attendances: { $push: '$$ROOT' },
      },
    },
    {
      $match: {
        count: { $gt: 1 },
      },
    },
  ])
  return duplicates
}

export async function getCourseAttendanceStats(courseId: string) {
  const attendances = await Attendance.find({
    course: courseId,
    isActive: true,
  })

  const stats = {
    totalSessions: attendances.length,
    averagePresenceRate: 0,
    totalStudents: 0,
  }

  if (attendances.length > 0) {
    const totalRate = attendances.reduce(
      (sum, att) => sum + att.presenceRate,
      0,
    )
    stats.averagePresenceRate = totalRate / attendances.length
    stats.totalStudents = attendances[attendances.length - 1].totalStudents
  }

  return stats
}

export async function getStudentAttendanceStats(studentId: string) {
  const attendances = await findAttendanceByStudent(studentId)

  const stats = {
    totalSessions: attendances.length,
    presentCount: 0,
    averagePresenceRate: 0,
  }

  attendances.forEach((attendance) => {
    const studentRecord = attendance.records.find(
      (r: AttendanceRecord) => r.student.toString() === studentId,
    )
    if (studentRecord?.isPresent) {
      stats.presentCount++
    }
  })

  stats.averagePresenceRate = (stats.presentCount / stats.totalSessions) * 100

  return stats
}

export async function updateAttendance(
  id: string,
  attendanceData: Partial<AttendanceType>,
) {
  const attendance = await Attendance.findByIdAndUpdate(
    id,
    { ...attendanceData, updatedAt: new Date() },
    { new: true },
  )
  if (!attendance) {
    throw new Error('Attendance not found')
  }
  const populatedAttendance = await attendance.populate([
    'course',
    'records.student',
  ])
  return populatedAttendance
}
