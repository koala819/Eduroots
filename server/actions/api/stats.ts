'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/server/utils/stats/student'
import { ApiResponse } from '@/types/api'
import {
  GlobalStatsResponse,
  StudentAttendanceResponse,
  StudentBehaviorResponse,
  StudentStatsPayload,
  TeacherStatsPayload,
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
      .select(`
        *,
        teacher_gender_distribution (
          count_masculin,
          count_feminin,
          count_undefined,
          percentage_masculin,
          percentage_feminin,
          percentage_undefined
        )
      `)
      .order('last_update', { ascending: false })

    if (studentError) {
      const errorMsg = 'Erreur lors de la récupération des statistiques étudiants'
      return {
        success: false,
        data: null,
        message: `${errorMsg}: ${studentError.message}`,
      }
    }

    if (teacherError) {
      const errorMsg = 'Erreur lors de la récupération des statistiques enseignants'
      return {
        success: false,
        data: null,
        message: `${errorMsg}: ${teacherError.message}`,
      }
    }

    // Combiner les deux tableaux
    const allStats = [...studentStats, ...teacherStats]
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
      .schema('stats')
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
      .schema('stats')
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
      return {
        success: false,
        data: null,
        message: `Erreur lors de la récupération des statistiques globales: ${error.message}`,
      }
    }

    if (!globalStats) {
      return {
        success: false,
        data: null,
        message: 'Aucune statistique globale trouvée',
      }
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
    console.error('[GET_GLOBAL_STATS]', error)
    return {
      success: false,
      data: null,
      message: 'Erreur lors de la récupération des statistiques globales',
    }
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
    const { supabase } = await getSessionServer()

    // Récupérer les statistiques de l'étudiant
    const { data: studentStats, error: statsError } = await supabase
      .schema('stats')
      .from('student_stats')
      .select('*')
      .eq('user_id', studentId)
      .single()

    if (statsError) {
      console.error('❌ Erreur lors de la récupération des stats:', statsError)
      throw statsError
    }

    // Récupérer les absences individuelles depuis student_stats_absences
    let absences: any[] = []
    if (studentStats) {
      const { data: absenceRecords, error: absenceError } = await supabase
        .schema('stats')
        .from('student_stats_absences')
        .select('*')
        .eq('student_stats_id', studentStats.id)

      if (!absenceError && absenceRecords) {
        absences = absenceRecords.map((absence) => ({
          date: new Date(absence.date),
          course: absence.course_session_id,
          reason: absence.reason,
        }))
      }
    }

    const response: StudentAttendanceResponse = {
      attendanceRate: studentStats?.absences_rate || 0,
      totalAbsences: studentStats?.absences_count || 0,
      absences: absences,
      lastUpdate: studentStats?.last_update || new Date().toISOString(),
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

async function fetchTeacherCoursesWithStudents(supabase: any, teacherId: string) {
  // D'abord, récupérer l'ID de la table users à partir de l'auth_id
  const { data: user, error: userError } = await supabase
    .schema('education')
    .from('users')
    .select('id')
    .or(`auth_id_email.eq.${teacherId},auth_id_gmail.eq.${teacherId}`)
    .single()

  if (userError || !user) {
    console.error('❌ Utilisateur non trouvé:', userError)
    return []
  }

  const userId = user.id

  const { data: courses, error: coursesError } = await supabase
    .schema('education')
    .from('courses')
    .select(`
      *,
      courses_teacher!inner (
        teacher_id
      ),
      courses_sessions (
        id,
        courses_sessions_students (
          student_id
        )
      )
    `)
    .eq('is_active', true)
    .eq('courses_teacher.teacher_id', userId)

  if (coursesError) {
    console.error('❌ Erreur lors de la récupération des cours:', coursesError)
    throw new Error(`Erreur lors de la récupération des cours: ${coursesError.message}`)
  }

  return courses
}

function extractStudentIds(courses: any[]): string[] {
  const studentIds = new Set<string>()

  for (const course of courses) {
    if (!course?.courses_sessions) {
      continue
    }

    for (const session of course.courses_sessions) {
      if (!session.courses_sessions_students) {
        continue
      }

      session.courses_sessions_students.forEach((enrollment: any) => {
        studentIds.add(enrollment.student_id)
      })
    }
  }

  return Array.from(studentIds)
}

async function recalculateStudentStats(studentIds: string[]) {
  for (const studentId of studentIds) {
    await calculateStudentAttendanceRate(studentId)
  }
}

async function getUpdatedStudentStats(supabase: any) {
  const { data: studentStats, error } = await supabase
    .schema('stats')
    .from('student_stats')
    .select('*')
    .order('last_update', { ascending: false })

  if (error) {
    throw new Error(`Erreur lors de la récupération des statistiques: ${error.message}`)
  }

  return studentStats
}

export async function refreshTeacherStudentsStats(): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase, user } = await getSessionServer()

  try {
    let updatedStudentIds: string[] = []

    // Toujours récupérer les cours et recalculer les statistiques
    const teacherCoursesData = await fetchTeacherCoursesWithStudents(supabase, user.id)

    // Si le professeur n'a pas de cours, en assigner un automatiquement
    if (!teacherCoursesData || teacherCoursesData.length === 0) {
      await assignCoursesToTeacher(supabase, user.id)

      // Récupérer à nouveau les cours après assignation
      const updatedTeacherCoursesData = await fetchTeacherCoursesWithStudents(supabase, user.id)
      if (updatedTeacherCoursesData && updatedTeacherCoursesData.length > 0) {
        const studentIds = extractStudentIds(updatedTeacherCoursesData)
        await recalculateStudentStats(studentIds)
        updatedStudentIds = studentIds
      }
    } else {
      const studentIds = extractStudentIds(teacherCoursesData)
      await recalculateStudentStats(studentIds)
      updatedStudentIds = studentIds
    }

    const studentStats = await getUpdatedStudentStats(supabase)

    return {
      success: true,
      data: { studentStats, studentsUpdated: updatedStudentIds.length },
      message: 'Statistiques des élèves mises à jour avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHER_STUDENTS_STATS]', error)
    throw new Error(
      'Erreur lors de la récupération des statistiques des élèves du professeur',
    )
  }
}

async function assignCoursesToTeacher(supabase: any, teacherId: string) {
  // D'abord, récupérer l'ID de la table users à partir de l'auth_id
  const { data: user, error: userError } = await supabase
    .schema('education')
    .from('users')
    .select('id')
    .or(`auth_id_email.eq.${teacherId},auth_id_gmail.eq.${teacherId}`)
    .single()

  if (userError || !user) {
    console.error('❌ Utilisateur non trouvé pour assignation:', userError)
    return
  }

  const userId = user.id

  // Récupérer tous les cours actifs
  const { data: allCourses, error: coursesError } = await supabase
    .schema('education')
    .from('courses')
    .select('id')
    .eq('is_active', true)

  if (coursesError || !allCourses?.length) {
    return
  }

  // Assigner le premier cours au professeur (pour test)
  const courseToAssign = allCourses[0]

  const { error: assignError } = await supabase
    .schema('education')
    .from('courses_teacher')
    .insert({
      course_id: courseToAssign.id,
      teacher_id: userId,
      is_active: true,
    })

  if (assignError) {
    console.error('❌ Erreur lors de l\'assignation:', assignError)
  }
}
