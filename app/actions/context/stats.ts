'use server'

import { getServerSession } from 'next-auth'
import { revalidatePath } from 'next/cache'

import { ApiResponse } from '@/types/api'
import { EntityStats, StudentStats, TeacherStats } from '@/types/stats'

import dbConnect, { isConnected } from '@/backend/config/dbConnect'
import { Attendance } from '@/backend/models/attendance.model'
import { StudentStats as StudentStatsModel } from '@/backend/models/student-stats.model'
import { TeacherStats as TeacherStatsModel } from '@/backend/models/teacher-stats.model'
import { User } from '@/backend/models/user.model'
import { SerializedValue, serializeData } from '@/lib/serialization'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/lib/stats/student'
import { isValidObjectId } from 'mongoose'

async function getSessionServer() {
  const session = await getServerSession()
  if (!session || !session.user) {
    throw new Error('Non authentifié')
  }
  return session
}

export async function refreshEntityStats(): Promise<
  ApiResponse<SerializedValue>
> {
  await getSessionServer()

  try {
    if (!isConnected()) {
      console.log('MongoDB not connected, reconnecting...')
      await dbConnect()
    }

    const studentStats = await executeWithRetry(() =>
      StudentStatsModel.find().sort({ lastUpdate: -1 }).lean(),
    )
    const teacherStats = await executeWithRetry(() =>
      TeacherStatsModel.find().sort({ lastUpdate: -1 }).lean(),
    )

    const serializedStudentStats = studentStats.map((stat) => ({
      ...(serializeData(stat) as object),
    })) as EntityStats[]

    const serializedTeacherStats = teacherStats.map((stat) => ({
      ...(serializeData(stat) as object),
    })) as EntityStats[]

    // Combinez les deux tableaux
    const allStats = [...serializedStudentStats, ...serializedTeacherStats]
    return {
      success: true,
      data: allStats ? serializeData(allStats) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ENTITY_STATS]', error)
    throw new Error(
      'Erreur lors de la récupération des statistiques des entités',
    )
  }
}

/**
 * Met à jour les statistiques d'un étudiant
 */
export async function updateStudentStats(
  id: string,
  statsData: StudentStats,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: 'ID invalide',
        data: null,
      }
    }

    // Validation des statsData pour un étudiant
    const requiredFields = [
      'attendanceRate',
      'totalAbsences',
      'behaviorAverage',
    ]
    if (!requiredFields.every((field) => field in statsData)) {
      return {
        success: false,
        message: 'Champs requis manquants pour les statistiques étudiantes',
        data: null,
      }
    }

    const stats = await StudentStatsModel.findOneAndUpdate(
      { userId: id },
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
    ).lean()

    if (!stats) {
      return {
        success: false,
        message: 'Stats non trouvé',
        data: null,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/students/${id}`)

    return {
      success: true,
      data: stats ? serializeData(stats) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_STUDENT_STATS]', error)
    throw error
  }
}

/**
 * Met à jour les statistiques d'un enseignant
 */
export async function updateTeacherStats(
  id: string,
  statsData: TeacherStats,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    if (!isValidObjectId(id)) {
      return {
        success: false,
        message: 'ID invalide',
        data: null,
      }
    }

    // Validation des statsData pour un professeur
    const requiredFields = ['attendanceRate', 'totalSessions']

    if (!requiredFields.every((field) => field in statsData)) {
      return {
        success: false,
        message: 'Champs requis manquants pour les statistiques enseignantes',
        data: null,
      }
    }

    const stats = await TeacherStatsModel.findOneAndUpdate(
      { userId: id },
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
    ).lean()

    if (!stats) {
      return {
        success: false,
        message: 'Stats non trouvé',
        data: null,
      }
    }

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath(`/teachers/${id}`)

    return {
      success: true,
      data: stats ? serializeData(stats) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER_STATS]', error)
    throw error
  }
}

/**
 * Récupère les statistiques globales
 */
export async function refreshGlobalStats(): Promise<
  ApiResponse<SerializedValue>
> {
  await getSessionServer()

  try {
    if (!isConnected()) {
      console.log('MongoDB not connected, connecting...')
      await dbConnect()

      // Add a short delay to ensure connection is fully ready
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Double-check connection is established
      if (!isConnected()) {
        console.error('Failed to establish MongoDB connection after attempt')
        throw new Error('Database connection failed')
      }
    }

    // Use executeWithRetry for all database operations
    const attendances = await executeWithRetry(() =>
      Attendance.find({ isActive: true }).lean(),
    )

    // Calculer la moyenne des taux de présence
    let totalPresenceRate = 0
    attendances.forEach((attendance) => {
      totalPresenceRate += attendance.stats.presenceRate
    })

    const averagePresenceRate =
      attendances.length > 0 ? totalPresenceRate / attendances.length : 0

    const teachers = await User.find({ role: 'teacher', isActive: true })
    const students = await User.find({ role: 'student', isActive: true })
    const totalStudents = students.length

    return {
      success: true,
      data: serializeData({
        presenceRate: averagePresenceRate,
        totalStudents: totalStudents,
        totalTeachers: teachers.length,
        lastUpdate: new Date(),
      }),
      message: 'Cours récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_GLOBAL_STATS]', error)
    throw new Error('Erreur lors de la récupération des statistiques globales')
  }
}

/**
 * Récupère les données de présence d'un étudiant
 */
export async function getStudentAttendance(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  if (!studentId) {
    return {
      success: false,
      message: 'Student ID missing',
      data: null,
    }
  }

  try {
    const data = await calculateStudentAttendanceRate(studentId)

    return {
      success: true,
      data: data ? serializeData(data) : null,
      message: "Absences de l'étudiant récupérées avec succès",
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données d'assiduité pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

/**
 * Récupère les données de comportement d'un étudiant
 */
export async function getStudentBehavior(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  if (!studentId) {
    return {
      success: false,
      message: 'Student ID missing',
      data: null,
    }
  }

  try {
    const data = await calculateStudentBehaviorRate(studentId)

    return {
      success: true,
      data: data ? serializeData(data) : null,
      message: "Comportements de l'étudiant récupérés avec succès",
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données de comportement pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

/**
 * Récupère les données de notes d'un étudiant
 */
export async function getStudentGrade(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  if (!studentId) {
    return {
      success: false,
      message: 'Student ID missing',
      data: null,
    }
  }

  try {
    const gradeData = await calculateStudentGrade(studentId)
    const data = gradeData?.grades

    return {
      success: true,
      data: data ? serializeData(data) : null,
      message: "Notes de l'étudiant récupérés avec succès",
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des notes pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

async function executeWithRetry<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
): Promise<T> {
  let lastError
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      // Ensure DB connection before each attempt
      await dbConnect()
      return await operation()
    } catch (error) {
      console.error(
        `Operation failed (attempt ${attempt}/${maxRetries}):`,
        error,
      )
      lastError = error

      // Only retry on connection-related errors
      if (!isConnectionError(error)) {
        throw error
      }

      // Wait before retrying (exponential backoff)
      if (attempt < maxRetries) {
        const delay = Math.min(100 * Math.pow(2, attempt), 3000)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

// Helper to identify connection-related errors
function isConnectionError(error: any): boolean {
  return (
    error.name === 'MongooseError' &&
    (error.message.includes('buffering timed out') ||
      error.message.includes('failed to connect') ||
      error.message.includes('Connection closed'))
  )
}
