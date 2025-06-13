'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { ApiResponse } from '@/types/supabase/api'
import { EntityStats, StudentStats, TeacherStats } from '@/types/stats'
import { SerializedValue, serializeData } from '@/lib/serialization'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/lib/stats/student'

async function getSessionServer() {
  try {
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()

    if (error) {
      console.error('[AUTH_ERROR]', error)
      throw new Error('Erreur d\'authentification')
    }

    if (!user) {
      throw new Error('Non authentifié')
    }

    return { user }
  } catch (error) {
    console.error('[GET_SESSION_ERROR]', error)
    throw new Error('Erreur lors de la vérification de l\'authentification')
  }
}

export async function refreshEntityStats(
  forceUpdate: boolean = false,
): Promise<ApiResponse<SerializedValue>> {
  try {
    await getSessionServer()
    const supabase = await createClient()

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
      ...(serializeData(stat) as object),
    })) as EntityStats[]

    const serializedTeacherStats = (teacherStats || []).map((stat: any) => ({
      ...(serializeData(stat) as object),
    })) as EntityStats[]

    // Combiner les deux tableaux
    const allStats = [...serializedStudentStats, ...serializedTeacherStats]
    return {
      success: true,
      data: serializeData(allStats),
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

/**
 * Met à jour les statistiques d'un étudiant
 */
export async function updateStudentStats(
  id: string,
  statsData: StudentStats,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
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

    const { data: stats, error } = await supabase
      .schema('education')
      .from('student_stats')
      .upsert({
        user_id: id,
        absences_rate: (statsData as any).absences_rate,
        absences_count: (statsData as any).absences_count,
        behavior_average: (statsData as any).behavior_average,
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
      data: serializeData(stats),
      message: 'Statistiques mises à jour avec succès',
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
  const supabase = await createClient()

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
        attendance_rate: (statsData as any).attendanceRate,
        total_sessions: (statsData as any).totalSessions,
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

    // Revalidate relevant paths
    revalidatePath('/dashboard')
    revalidatePath(`/teachers/${id}`)

    return {
      success: true,
      data: serializeData(stats),
      message: 'Statistiques mises à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER_STATS]', error)
    throw error
  }
}

/**
 * Récupère les statistiques globales
 */
export async function refreshGlobalStats(): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

  try {

    // Récupérer les statistiques globales les plus récentes
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

    const response = {
      success: true,
      data: serializeData({
        presenceRate: globalStats.average_attendance_rate || 0,
        totalStudents: globalStats.total_students || 0,
        totalTeachers: globalStats.total_teachers || 0,
        lastUpdate: globalStats.last_update,
      }),
      message: 'Statistiques globales récupérées avec succès',
    }

    return response
  } catch (error) {
    throw new Error('Erreur lors de la récupération des statistiques globales' + error)
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

/**
 * Met à jour uniquement les statistiques des élèves d'un professeur spécifique
 */
export async function refreshTeacherStudentsStats(
  forceUpdate: boolean = false,
): Promise<ApiResponse<SerializedValue>> {
  const session = await getSessionServer()
  const supabase = await createClient()

  try {
    // Si forceUpdate est true, recalculer les statistiques
    if (forceUpdate) {
      // Récupérer les cours du professeur
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
        .eq('teacher_id', session.user.id)

      if (coursesError) {
        throw new Error(`Erreur lors de la récupération des cours: ${coursesError.message}`)
      }

      // Récupérer tous les élèves uniques des cours du professeur
      const studentIds = new Set<string>()
      if (teacherCourses) {
        for (const teacherCourse of teacherCourses) {
          const course = (teacherCourse as any).courses
          if (course?.courses_sessions) {
            for (const session of course.courses_sessions) {
              if (session.courses_sessions_students) {
                session.courses_sessions_students.forEach((enrollment: any) => {
                  studentIds.add(enrollment.student_id)
                })
              }
            }
          }
        }
      }

      console.log('📊 Nombre d\'élèves du professeur trouvés:', studentIds.size)

      // Recalculer les statistiques pour chaque élève du professeur
      const uniqueStudentIds = Array.from(studentIds)
      for (const studentId of uniqueStudentIds) {
        console.log('📊 Recalcul des statistiques pour l\'élève:', studentId)
        await calculateStudentAttendanceRate(studentId)
      }
    }

    // Récupérer les statistiques mises à jour des élèves du professeur
    const { data: studentStats, error } = await supabase
      .schema('education')
      .from('student_stats')
      .select('*')
      .order('last_update', { ascending: false })

    if (error) {
      throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
    }

    const serializedStudentStats = (studentStats || []).map((stat: any) => ({
      ...(serializeData(stat) as object),
    })) as EntityStats[]

    return {
      success: true,
      data: serializeData(serializedStudentStats),
      message: 'Statistiques des élèves mises à jour avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHER_STUDENTS_STATS]', error)
    throw new Error(
      'Erreur lors de la récupération des statistiques des élèves du professeur',
    )
  }
}
