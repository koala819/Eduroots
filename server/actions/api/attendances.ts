'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { createClient } from '@/server/utils/supabase'
import { ApiResponse } from '@/types/api'
import {
  CreateAttendancePayload,
  UpdateAttendancePayload,
} from '@/types/attendance-payload'


export async function createAttendanceRecord(
  data: CreateAttendancePayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { courseId, date, records, sessionId } = data

    if (!courseId || !date || !records) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Vérification si un enregistrement existe déjà pour ce cours à cette date
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString()

    const { data: existingAttendance } = await supabase
      .schema('education')
      .from('attendances')
      .select('id')
      .eq('course_id', courseId)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .single()

    if (existingAttendance) {
      return {
        success: false,
        message: 'Un enregistrement existe déjà pour ce cours à cette date',
        data: null,
      }
    }

    // Calcul des statistiques
    const totalStudents = records.length
    const presentStudents = records.filter((record) => record.isPresent).length
    const presenceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0

    // Créer l'enregistrement de présence
    const { data: attendance, error: attendanceError } = await supabase
      .schema('education')
      .from('attendances')
      .insert({
        course_id: courseId,
        date: new Date(date).toISOString(),
        presence_rate: presenceRate,
        total_students: totalStudents,
        last_update: new Date().toISOString(),
      })
      .select()
      .single()

    if (attendanceError || !attendance) {
      throw new Error(`Erreur lors de la création de la présence: ${attendanceError?.message}`)
    }

    // Créer les enregistrements de présence pour chaque étudiant
    const attendanceRecords = records.map((record) => ({
      attendance_id: attendance.id,
      student_id: record.studentId,
      is_present: record.isPresent,
      comment: record.comment ?? null,
    }))

    const { error: recordsError } = await supabase
      .schema('education')
      .from('attendance_records')
      .insert(attendanceRecords)

    if (recordsError) {
      throw new Error(`Erreur lors de la création des enregistrements: ${recordsError.message}`)
    }

    // Mise à jour des statistiques de session si sessionId est fourni
    if (sessionId) {
      // Calculer la moyenne de présence pour cette session
      const { data: sessionAttendances } = await supabase
        .schema('education')
        .from('attendances')
        .select('presence_rate')
        .eq('course_id', courseId)

      if (sessionAttendances && sessionAttendances.length > 0) {
        const sessionPresenceRate = sessionAttendances
          .reduce((sum, att) => sum + att.presence_rate, 0) / sessionAttendances.length

        // Mettre à jour les stats de la session
        await supabase
          .schema('education')
          .from('courses_sessions')
          .update({
            stats_average_attendance: sessionPresenceRate,
            stats_last_updated: new Date().toISOString(),
          })
          .eq('id', sessionId)
      }
    }

    // Mise à jour des statistiques étudiants
    const updatePromises = records.map(async (record) => {
      const studentId = record.studentId

      // Obtenir les stats existantes de l'étudiant
      const { data: existingStats } = await supabase
        .schema('education')
        .from('student_stats')
        .select('*')
        .eq('user_id', studentId)
        .single()

      if (existingStats) {
        // Recalculer les statistiques
        const totalAbsences = record.isPresent
          ? existingStats.absences_count
          : existingStats.absences_count + 1

        // Calculer le nombre total de sessions pour cet étudiant
        const { count: totalSessions } = await supabase
          .schema('education')
          .from('attendance_records')
          .select('*', { count: 'exact' })
          .eq('student_id', studentId)

        const totalSessionsCount = (totalSessions ?? 0) + 1
        const absenceRate = totalSessionsCount > 0 ? (totalAbsences / totalSessionsCount) * 100 : 0

        await supabase
          .schema('education')
          .from('student_stats')
          .update({
            absences_rate: absenceRate,
            absences_count: totalAbsences,
            last_activity: new Date().toISOString(),
            last_update: new Date().toISOString(),
          })
          .eq('user_id', studentId)
      } else {
        // Créer de nouvelles stats pour l'étudiant
        const initialAbsences = record.isPresent ? 0 : 1
        const initialRate = record.isPresent ? 0 : 100

        await supabase
          .schema('education')
          .from('student_stats')
          .insert({
            user_id: studentId,
            absences_rate: initialRate,
            absences_count: initialAbsences,
            behavior_average: 0,
            last_activity: new Date().toISOString(),
            last_update: new Date().toISOString(),
          })
      }
    })

    await Promise.all(updatePromises)

    // Mise à jour des statistiques globales
    const { data: allAttendances } = await supabase
      .schema('education')
      .from('attendances')
      .select('presence_rate')

    if (allAttendances && allAttendances.length > 0) {
      const averageAttendanceRate = allAttendances
        .reduce((sum, att) => sum + att.presence_rate, 0) / allAttendances.length

      // Obtenir ou créer les stats globales
      const { data: globalStats } = await supabase
        .schema('stats')
        .from('global_stats')
        .select('*')
        .single()

      if (globalStats) {
        await supabase
          .schema('stats')
          .from('global_stats')
          .update({
            average_attendance_rate: averageAttendanceRate,
            last_update: new Date().toISOString(),
          })
          .eq('id', globalStats.id)
      } else {
        await supabase
          .schema('stats')
          .from('global_stats')
          .insert({
            total_students: totalStudents,
            total_teachers: 0,
            average_attendance_rate: averageAttendanceRate,
            presence_rate: presenceRate,
            last_update: new Date().toISOString(),
          })
      }
    }

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
      message: error.message ?? 'Erreur lors de la création de la présence',
      data: null,
    }
  }
}

export async function deleteAttendance(
  attendanceId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: attendance, error } = await supabase
      .schema('education')
      .from('attendances')
      .delete()
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return {
      success: true,
      data: attendance,
      message: 'Absence supprimée avec succès',
    }
  } catch (error: any) {
    console.error('Error deleting attendance record:', error)
    throw error
  }
}

export async function getAttendanceById(
  courseId: string,
  date?: string,
  checkToday?: boolean,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    let query = supabase
      .schema('education')
      .from('attendances')
      .select(`
        *,
        attendance_records (
          *,
          users:student_id (
            id,
            firstname,
            lastname,
            email
          )
        )
      `)
      .eq('course_id', courseId)

    if (checkToday) {
      const today = new Date().toISOString().split('T')[0]
      query = query.gte('date', `${today}T00:00:00.000Z`)
        .lt('date', `${today}T23:59:59.999Z`)
    } else if (date) {
      const searchDate = date.split('T')[0]
      // Rechercher avec le format exact de la base de données (YYYY-MM-DD)
      query = query.eq('date', searchDate)
    }

    // Si une date est spécifiée ou checkToday est true, utiliser .single()
    // Sinon, retourner toutes les attendances (tableau)
    const { data: attendances, error } = date || checkToday ?
      await query.single() :
      await query

    if (error) {
      if (error.code === 'PGRST116') {
        return {
          success: true,
          data: null,
          message: 'Aucune attendance trouvée pour cette date',
        }
      }
      return {
        success: false,
        data: null,
        message: `Erreur lors de la récupération: ${error.message}`,
      }
    }

    return {
      success: true,
      data: attendances,
      message: 'Attendance récupérée avec succès',
    }
  } catch (error) {
    console.error('Erreur dans getAttendanceById:', error)
    return {
      success: false,
      data: null,
      message: 'Erreur interne du serveur',
    }
  }
}

export async function getStudentAttendanceHistory(
  studentId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: attendances, error } = await supabase
      .schema('education')
      .from('attendance_records')
      .select(`
        *,
        attendances (
          *,
          courses_sessions (
            subject,
            level
          )
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: attendances,
      message: 'Historique de présence récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_ATTENDANCE_HISTORY]', error)
    throw new Error('Erreur lors de la récupération de l\'historique')
  }
}

export async function restoreAttendance(
  attendanceId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: attendance, error } = await supabase
      .schema('education')
      .from('attendances')
      .select()
      .eq('id', attendanceId)
      .single()

    if (error) {
      throw new Error(`Erreur lors de la restauration: ${error.message}`)
    }

    return {
      success: true,
      data: attendance,
      message: 'Enregistrement restauré avec succès',
    }
  } catch (error: any) {
    console.error('Error restoring attendance record:', error)
    throw error
  }
}

export async function softDeleteAttendance(
  attendanceId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: attendance, error } = await supabase
      .schema('education')
      .from('attendances')
      .delete()
      .eq('id', attendanceId)
      .select()
      .single()

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return {
      success: true,
      data: attendance,
      message: 'Absence supprimée avec succès',
    }
  } catch (error: any) {
    console.error('Error soft deleting attendance record:', error)
    throw error
  }
}

export async function updateAttendanceRecord(
  data: UpdateAttendancePayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { attendanceId, records } = data

    if (!records || !Array.isArray(records)) {
      return {
        success: false,
        message: 'Les données de présence sont invalides',
        data: null,
      }
    }

    // Récupérer l'ancien enregistrement
    const { data: oldAttendance, error: fetchError } = await supabase
      .schema('education')
      .from('attendances')
      .select(`
        *,
        attendance_records (*)
      `)
      .eq('id', attendanceId)
      .single()

    if (fetchError || !oldAttendance) {
      return {
        success: false,
        message: 'Fiche de présence non trouvée',
        data: null,
      }
    }

    // Calculer les nouvelles statistiques
    const totalStudents = records.length
    const presentStudents = records.filter((record) => record.isPresent).length
    const presenceRate = totalStudents > 0 ? (presentStudents / totalStudents) * 100 : 0

    // 1. Supprimer d'abord les anciens enregistrements
    const { error: deleteError } = await supabase
      .schema('education')
      .from('attendance_records')
      .delete()
      .eq('attendance_id', attendanceId)

    if (deleteError) {
      throw new Error(`Erreur lors de la suppression des anciens enregistrements:
        ${deleteError.message}`)
    }

    // 2. Créer les nouveaux enregistrements
    const newRecords = records.map((record) => ({
      attendance_id: attendanceId,
      student_id: record.studentId,
      is_present: record.isPresent,
      comment: record.comment ?? null,
    }))

    const { error: insertError } = await supabase
      .schema('education')
      .from('attendance_records')
      .insert(newRecords)

    if (insertError) {
      throw new Error(`Erreur lors de l'insertion: ${insertError.message}`)
    }

    // 3. Mettre à jour l'enregistrement principal
    const { error: updateError } = await supabase
      .schema('education')
      .from('attendances')
      .update({
        presence_rate: presenceRate,
        total_students: totalStudents,
        last_update: new Date().toISOString(),
      })
      .eq('id', attendanceId)

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    revalidatePath('/courses/[courseId]/attendance', 'page')
    if (oldAttendance.course_id) {
      revalidatePath(`/courses/${oldAttendance.course_id}/attendance`, 'page')
      revalidatePath(`/courses/${oldAttendance.course_id}`, 'page')
    }

    // Forcer un délai pour s'assurer que la revalidation est terminée
    await new Promise((resolve) => setTimeout(resolve, 1000))

    return {
      success: true,
      message: 'Présence mise à jour avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('❌ Erreur globale mise à jour présence:', error)
    return {
      success: false,
      message: error.message ?? 'Erreur lors de la mise à jour de la présence',
      data: null,
    }
  }
}
