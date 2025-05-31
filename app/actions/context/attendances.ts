'use server'

import {getServerSession} from 'next-auth'
import {revalidatePath} from 'next/cache'

import {ApiResponse} from '@/types/api'
import {CreateAttendancePayload, UpdateAttendancePayload} from '@/types/attendance'
import {CourseSession} from '@/types/course'

import {Attendance} from '@/backend/models/attendance.model'
import {Course} from '@/backend/models/course.model'
import {GlobalStats} from '@/backend/models/global-stats.model'
import {StudentStats} from '@/backend/models/student-stats.model'
import {SerializedValue, serializeData} from '@/lib/serialization'
import {Types} from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function createAttendanceRecord(
  data: CreateAttendancePayload,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const {courseId, date, records, sessionId} = data

    if (!courseId || !date || !records) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Vérification si un enregistrement existe déjà pour ce cours à cette date
    const existingAttendance = await Attendance.findOne({
      course: new Types.ObjectId(courseId),
      date: {
        // On utilise $gte et $lt pour comparer la date sans l'heure
        $gte: new Date(new Date(date).setHours(0, 0, 0, 0)),
        $lt: new Date(new Date(date).setHours(23, 59, 59, 999)),
      },
    })

    if (existingAttendance) {
      return {
        success: false,
        message: 'Un enregistrement existe déjà pour ce cours à cette date',
        data: null,
      }
    }

    // Calcul des statistiques
    const totalStudents = records.length
    // Fix the type here - records in the payload has a simpler structure than AttendanceRecord
    const presentStudents = records.filter((record) => record.isPresent).length
    const presenceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0

    const attendance = new Attendance({
      course: new Types.ObjectId(courseId),
      date: new Date(date),
      records: records.map((record) => ({
        student: new Types.ObjectId(record.student),
        isPresent: record.isPresent,
        comment: record.comment,
      })),
      stats: {
        presenceRate,
        totalStudents,
        lastUpdate: new Date(),
      },
    })

    await attendance.save()

    // Mise à jour des stats du cours
    const course = await Course.findById(courseId)
    if (course && sessionId) {
      // Trouver la session correspondante
      const sessionIndex = course.sessions.findIndex(
        (session: CourseSession) => session.id.toString() === sessionId.toString(),
      )

      if (sessionIndex !== -1) {
        // Calculer la moyenne de présence pour cette session
        const allAttendances = await Attendance.find({
          sessionId: new Types.ObjectId(sessionId),
        })

        const sessionPresenceRate =
          allAttendances.reduce((sum, att) => sum + (att.stats?.presenceRate || 0), 0) /
          (allAttendances.length || 1) // Éviter division par 0

        // Mettre à jour les stats de la session
        await Course.updateOne(
          {
            _id: courseId,
            'sessions._id': sessionId,
          },
          {
            $set: {
              'sessions.$.stats.averageAttendance': sessionPresenceRate,
              'sessions.$.stats.lastUpdated': new Date(),
            },
          },
        )
      }
    }

    // Mise à jour des stats pour chaque étudiant
    const updatePromises = records.map(async (record) => {
      const studentId = record.student

      // Calculer les nouvelles stats
      const existingStats = await StudentStats.findOne({
        userId: new Types.ObjectId(studentId),
      })

      const totalSessions = (existingStats?.statsData?.totalSessions || 0) + 1
      const totalAbsences =
        (existingStats?.statsData?.totalAbsences || 0) + (record.isPresent ? 0 : 1)
      const attendanceRate = ((totalSessions - totalAbsences) / totalSessions) * 100

      // Utiliser updateOne avec upsert pour éviter les conflits
      await StudentStats.updateOne(
        {userId: new Types.ObjectId(studentId)},
        {
          $set: {
            statsData: {
              ...(existingStats?.statsData || {}),
              attendanceRate,
              totalAbsences,
              totalSessions,
              lastAttendance: new Date(date),
            },
            lastUpdate: new Date(),
          },
        },
        {upsert: true},
      )
    })

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises)

    // Mise à jour des stats globales
    let globalStats = await GlobalStats.findOne({})
    if (!globalStats) {
      globalStats = new GlobalStats({
        totalStudents,
        averageAttendanceRate: presenceRate,
      })
    } else {
      // Calculer la nouvelle moyenne globale de présence
      const allAttendances = await Attendance.find({})
      const totalAttendanceRates = allAttendances.reduce(
        (sum, att) => sum + (att.stats?.presenceRate || 0),
        0,
      )
      const averageAttendanceRate =
        allAttendances.length > 0 ? totalAttendanceRates / allAttendances.length : 0

      globalStats.averageAttendanceRate = averageAttendanceRate
      globalStats.lastUpdate = new Date()
    }
    await globalStats.save()

    // Revalidate paths that might be affected
    revalidatePath('/courses/[courseId]/attendance')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Présence et statistiques mises à jour avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[CREATE_ATTENDANCE_RECORD]', error)
    return {
      success: false,
      message: error.message || 'Erreur lors de la création de la présence',
      data: null,
    }
  }
}

export async function deleteAttendanceRecord(
  attendanceId: string,
): Promise<ApiResponse<SerializedValue>> {
  try {
    const attendance = await Attendance.findById(attendanceId)

    if (!attendance) {
      return {
        success: false,
        message: "Enregistrement d'assiduité non trouvé",
        data: null,
      }
    }

    await Attendance.findByIdAndDelete(attendanceId)

    // Revalidate paths that would show attendance data
    // This will ensure any pages displaying attendance lists are refreshed
    revalidatePath('/courses/[courseId]/attendance')

    // If you know the specific courseId, you can make the path more specific
    // For example, if attendance.course is available:
    if (attendance.course) {
      revalidatePath(`/courses/${attendance.course}/attendance`)
    }

    return {
      success: true,
      message: 'Présence supprimée avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[DELETE_ATTENDANCE_RECORD]', error)
    return {
      success: false,
      message: error.message || 'Erreur lors de la suppression de la présence',
      data: null,
    }
  }
}

export async function getAttendanceById(
  courseId: string,
  date: string,
  checkToday?: boolean,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const query: any = {course: courseId}

    if (checkToday) {
      // Add logic to get today's attendance
      const today = new Date()
      const todayStr = today.toISOString().split('T')[0]
      query.$expr = {
        $eq: [{$dateToString: {format: '%Y-%m-%d', date: '$date'}}, todayStr],
      }
    } else if (date) {
      const searchDate = date.split('T')[0] // garde juste YYYY-MM-DD
      query.$expr = {
        $eq: [{$dateToString: {format: '%Y-%m-%d', date: '$date'}}, searchDate],
      }
    }

    const attendances =
      date || checkToday ? await Attendance.findOne(query) : await Attendance.find(query)
    return {
      success: true,
      data: attendances ? serializeData(attendances) : null,
      message: 'Absence récupérée avec succès',
    }
  } catch (error) {
    console.error('[GET_ATTENDANCE_BY_ID]', error)
    throw new Error('Erreur lors de la récupération du cours')
  }
}

export async function getStudentAttendanceHistory(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const attendances = await Attendance.find({
      'records.student': studentId,
    })
      .populate('course')
      .populate('records.student')

    return {
      success: true,
      data: attendances ? serializeData(attendances) : null,
      message: 'Abence récupérée avec succès',
    }
  } catch (error) {
    console.error('[GET_ATTENDANCE_HISTORY]', error)
    throw new Error('Erreur lors de la récupération du cours')
  }
}

export async function restoreAttendance(
  attendanceId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        isActive: true,
        deletedAt: null,
      },
      {new: true},
    )

    if (!attendance) {
      return {
        success: false,
        message: "Enregistrement d'assiduité non trouvé",
        data: null,
      }
    }

    return {
      success: true,
      data: serializeData(attendance),
      message: 'Enregistrement restauré avec succès',
    }
  } catch (error) {
    console.error('Error restoring attendance record:', error)
    throw error
  }
}

export async function softDeleteAttendance(
  attendanceId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const attendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        isActive: false,
        deletedAt: new Date(),
      },
      {new: true},
    )

    if (!attendance) {
      return {
        success: false,
        message: "Enregistrement d'assiduité non trouvé",
        data: null,
      }
    }
    return {
      success: true,
      data: attendance ? serializeData(attendance) : null,
      message: 'Absence supprimées avec succès',
    }
  } catch (error) {
    console.error('Error soft deleting attendance record:', error)
    throw error
  }
}

export async function updateAttendanceRecord(
  data: UpdateAttendancePayload,
): Promise<ApiResponse<SerializedValue>> {
  try {
    const {attendanceId, records} = data

    if (!records || !Array.isArray(records)) {
      return {
        success: false,
        message: 'Les données de présence sont invalides',
        data: null,
      }
    }
    // Récupérer l'ancien enregistrement pour comparer les changements
    const oldAttendance = await Attendance.findById(attendanceId)

    if (!oldAttendance) {
      return {
        success: false,
        message: 'Fiche de présence non trouvée',
        data: null,
      }
    }

    // Calculer les nouvelles statistiques pour cette présence
    const totalStudents = data.records.length
    const presentStudents = records.filter((record) => record.isPresent).length
    const presenceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0

    const updatedAttendance = await Attendance.findByIdAndUpdate(
      attendanceId,
      {
        $set: {
          records: data.records,
          stats: {
            presenceRate,
            totalStudents,
            lastUpdate: new Date(),
          },
        },
      },
      {
        new: true,
        runValidators: true,
      },
    )

    if (!updatedAttendance) {
      return {
        success: false,
        message: 'Fiche de présence non trouvée',
        data: null,
      }
    }

    // Mettre à jour les stats du course
    const course = await Course.findById((oldAttendance as any).courseId)
    if (course) {
      // Trouver la session correspondante si elle existe
      const sessionId = (oldAttendance as any).sessionId
      if (sessionId) {
        const sessionIndex = course.sessions.findIndex(
          (session: CourseSession) => session.id.toString() === sessionId.toString(),
        )

        if (sessionIndex !== -1) {
          // Calculer la moyenne de présence pour cette session
          const allAttendances = await Attendance.find({
            sessionId: new Types.ObjectId(sessionId),
          })

          const sessionPresenceRate =
            allAttendances.reduce((sum, att) => sum + (att.stats?.presenceRate || 0), 0) /
            (allAttendances.length || 1) // éviter division par zéro

          // Mettre à jour les stats de la session
          await Course.updateOne(
            {
              _id: course._id,
              'sessions._id': sessionId,
            },
            {
              $set: {
                'sessions.$.stats.averageAttendance': sessionPresenceRate,
                'sessions.$.stats.lastUpdated': new Date(),
              },
            },
          )
        }
      }
    }

    // Créer un map des anciens statuts de présence pour comparaison
    const oldPresenceMap = new Map(
      oldAttendance.records.map((record: any) => [record.student.toString(), record.isPresent]),
    )

    // Mise à jour des stats pour chaque étudiant
    const updatePromises = data.records.map(async (record: any) => {
      const studentId = record.student
      const oldPresence = oldPresenceMap.get(studentId.toString())

      // Ne mettre à jour que si le statut a changé
      if (oldPresence !== record.isPresent) {
        const studentStats = await StudentStats.findOne({
          userId: new Types.ObjectId(studentId),
        })

        if (studentStats) {
          // Ajuster les statistiques en fonction du changement
          const attendanceDiff = record.isPresent ? -1 : 1 // Si nouveau status est présent, réduire les absences
          const totalAbsences = studentStats.statsData.totalAbsences + attendanceDiff
          const attendanceRate =
            ((studentStats.statsData.totalSessions - totalAbsences) /
              studentStats.statsData.totalSessions) *
            100

          studentStats.statsData = {
            ...studentStats.statsData,
            attendanceRate: Math.max(0, Math.min(100, attendanceRate)),
            totalAbsences: Math.max(0, totalAbsences),
            lastAttendance: new Date(),
          }

          await studentStats.save()
        }
      }
    })

    // Mise à jour des stats globales
    const globalStats = await GlobalStats.findOne({})
    if (globalStats) {
      // Recalculer la moyenne globale de présence
      const allAttendances = await Attendance.find({})
      const totalAttendanceRates = allAttendances.reduce(
        (sum, att) => sum + (att.stats?.presenceRate || 0),
        0,
      )
      const averageAttendanceRate =
        allAttendances.length > 0 ? totalAttendanceRates / allAttendances.length : 0

      globalStats.averageAttendanceRate = averageAttendanceRate
      globalStats.lastUpdate = new Date()
      await globalStats.save()
    }

    // Attendre que toutes les mises à jour soient terminées
    await Promise.all(updatePromises)

    // Revalidate relevant paths
    revalidatePath('/courses/[courseId]/attendance')

    // If you have the courseId, you can also revalidate specific paths
    if (oldAttendance.course) {
      revalidatePath(`/courses/${oldAttendance.course}/attendance`)
      revalidatePath(`/courses/${oldAttendance.course}`)
    }

    return {
      success: true,
      message: 'Présence mise à jour avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[UPDATE_ATTENDANCE_RECORD]', error)
    return {
      success: false,
      message: error.message || 'Erreur lors de la mise à jour de la présence',
      data: null,
    }
  }
}
