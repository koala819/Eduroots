'use server'

import { getSessionServer } from '@/server/utils/server-helpers'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { revalidatePath } from 'next/cache'
import { ApiResponse } from '@/types/api'
import { EntityStats } from '@/types/stats'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/server/utils/stats/student'
import {
  StudentStatsPayload,
  TeacherStatsPayload,
  GlobalStatsResponse,
  StudentAttendanceResponse,
  StudentBehaviorResponse,
} from '@/types/stats-payload'

export async function refreshEntityStats(
  forceUpdate: boolean = false,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Si forceUpdate est true, recalculer les statistiques
    if (forceUpdate) {
      // Récupérer tous les étudiants
      const { data: students, error } = await supabase
        .schema('education')
        .from('users')
        .select('id')
        .eq('role', 'student')
        .eq('is_active', true)

      if (error) {
        throw new Error(`Erreur lors de la récupération des étudiants: ${error.message}`)
      }

      console.log('📊 Nombre d\'étudiants trouvés:', students?.length || 0)

      // Recalculer les statistiques pour chaque étudiant
      if (students) {
        for (const student of students) {
          console.log('📊 Recalcul des statistiques pour l\'étudiant:', student.id)
          await calculateStudentAttendanceRate(student.id)
        }
      }
    }

    // Récupérer les statistiques mises à jour
    const { data: studentStats, error: studentError } = await supabase
      .schema('stats')
      .from('student_stats')
      .select('*')
      .order('last_update', { ascending: false })

    const { data: teacherStats, error: teacherError } = await supabase
      .schema('stats')
      .from('teacher_stats')
      .select('*')
      .order('last_update', { ascending: false })

    if (studentError) {
      const errorMsg = 'Erreur lors de la récupération des statistiques étudiants'
      throw new Error(`${errorMsg}: ${studentError.message}`)
    }

    if (teacherError) {
      const errorMsg = 'Erreur lors de la récupération des statistiques enseignants'
      throw new Error(`${errorMsg}: ${teacherError.message}`)
    }

    const serializedStudentStats = (studentStats || []).map((stat: any) => ({
      ...stat,
    })) as EntityStats[]

    const serializedTeacherStats = (teacherStats || []).map((stat: any) => ({
      ...stat,
    })) as EntityStats[]

    // Combiner les deux tableaux
    const allStats = [...serializedStudentStats, ...serializedTeacherStats]
    return {
      success: true,
      data: allStats,
      message: 'Statistiques mises à jour avec succès',
    }
  } catch (error) {
    console.error('[GET_ENTITY_STATS]', error)
    const errorMsg = 'Erreur lors de la récupération des statistiques des entités'
    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : errorMsg,
    }
  }
}

export async function updateStudentStats(
  id: string,
  statsData: StudentStatsPayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: stats, error } = await supabase
      .schema('education')
      .from('student_stats')
      .upsert({
        user_id: id,
        absences_rate: statsData.attendanceRate,
        absences_count: statsData.totalAbsences,
        behavior_average: statsData.behaviorAverage,
        last_update: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !stats) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour des statistiques',
        data: null,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/students/${id}`)

    return {
      success: true,
      data: stats,
      message: 'Statistiques mises à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_STUDENT_STATS]', error)
    throw error
  }
}

export async function updateTeacherStats(
  id: string,
  statsData: TeacherStatsPayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Validation des statsData pour un professeur
    const requiredFields = ['attendanceRate', 'totalSessions']

    if (!requiredFields.every((field) => field in statsData)) {
      return {
        success: false,
        message: 'Champs requis manquants pour les statistiques enseignantes',
        data: null,
      }
    }

    const { data: stats, error } = await supabase
      .schema('education')
      .from('teacher_stats')
      .upsert({
        user_id: id,
        attendance_rate: statsData.attendanceRate,
        total_sessions: statsData.totalSessions,
        last_update: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !stats) {
      return {
        success: false,
        message: 'Erreur lors de la mise à jour des statistiques',
        data: null,
      }
    }

    revalidatePath('/dashboard')
    revalidatePath(`/teachers/${id}`)

    return {
      success: true,
      data: stats,
      message: 'Statistiques mises à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER_STATS]', error)
    throw error
  }
}

export async function refreshGlobalStats(): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: globalStats, error } = await supabase
      .schema('stats')
      .from('global_stats')
      .select('*')
      .order('last_update', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques globales: ${error.message}`)
    }

    if (!globalStats) {
      throw new Error('Aucune statistique globale trouvée')
    }

    const response: GlobalStatsResponse = {
      presenceRate: globalStats.average_attendance_rate ?? 0,
      totalStudents: globalStats.total_students ?? 0,
      totalTeachers: globalStats.total_teachers ?? 0,
      lastUpdate: globalStats.last_update,
    }

    return {
      success: true,
      data: response,
      message: 'Statistiques globales récupérées avec succès',
    }
  } catch (error) {
    throw new Error('Erreur lors de la récupération des statistiques globales' + error)
  }
}

export async function getStudentAttendance(
  studentId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()

  if (!studentId) {
    return {
      success: false,
      message: 'Student ID missing',
      data: null,
    }
  }

  try {
    const data = await calculateStudentAttendanceRate(studentId)
    const response: StudentAttendanceResponse = {
      attendanceRate: data.absencesRate,
      totalAbsences: data.absencesCount,
      lastUpdate: new Date().toISOString(),
    }

    return {
      success: true,
      data: response,
      message: 'Absences de l\'étudiant récupérées avec succès',
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données d'assiduité pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

export async function getStudentBehavior(
  studentId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()

  if (!studentId) {
    return {
      success: false,
      message: 'Student ID missing',
      data: null,
    }
  }

  try {
    const data = await calculateStudentBehaviorRate(studentId)
    const response: StudentBehaviorResponse = {
      behaviorAverage: data.behaviorAverage,
      totalIncidents: data.records.length,
      lastUpdate: new Date().toISOString(),
    }

    return {
      success: true,
      data: response,
      message: 'Comportements de l\'étudiant récupérés avec succès',
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des données de comportement pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

export async function getStudentGrade(
  studentId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()

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
      data: data,
      message: 'Notes de l\'étudiant récupérés avec succès',
    }
  } catch (error) {
    console.error(
      `Erreur lors de la récupération des notes pour l'étudiant ${studentId}:`,
      error,
    )
    throw error
  }
}

async function getTeacherCourses(supabase: any, teacherId: string) {
  const { data: teacherCourses, error: coursesError } = await supabase
    .schema('education')
    .from('courses_teacher')
    .select(`
      courses (
        courses_sessions (
          courses_sessions_students (
            student_id
          )
        )
      )
    `)
    .eq('teacher_id', teacherId)

  if (coursesError) {
    throw new Error(`Erreur lors de la récupération des cours: ${coursesError.message}`)
  }

  return teacherCourses
}

function extractStudentIds(teacherCourses: any[]): string[] {
  const studentIds = new Set<string>()

  for (const teacherCourse of teacherCourses) {
    const course = teacherCourse.courses
    if (!course?.courses_sessions) continue

    for (const session of course.courses_sessions) {
      if (!session.courses_sessions_students) continue

      session.courses_sessions_students.forEach((enrollment: any) => {
        studentIds.add(enrollment.student_id)
      })
    }
  }

  return Array.from(studentIds)
}

async function recalculateStudentStats(studentIds: string[]) {
  console.log('📊 Nombre d\'élèves du professeur trouvés:', studentIds.length)

  for (const studentId of studentIds) {
    console.log('📊 Recalcul des statistiques pour l\'élève:', studentId)
    await calculateStudentAttendanceRate(studentId)
  }
}

async function getUpdatedStudentStats(supabase: any) {
  const { data: studentStats, error } = await supabase
    .schema('education')
    .from('student_stats')
    .select('*')
    .order('last_update', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
  }

  return studentStats
}

export async function refreshTeacherStudentsStats(
  forceUpdate: boolean = false,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase, user } = await getSessionServer()

  try {
    if (forceUpdate) {
      const teacherCourses = await getTeacherCourses(supabase, user.id)
      const studentIds = extractStudentIds(teacherCourses)
      await recalculateStudentStats(studentIds)
    }

    const studentStats = await getUpdatedStudentStats(supabase)

    return {
      success: true,
      data: studentStats,
      message: 'Statistiques des élèves mises à jour avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHER_STUDENTS_STATS]', error)
    throw new Error(
      'Erreur lors de la récupération des statistiques des élèves du professeur',
    )
  }
}
