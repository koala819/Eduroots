'use server'

import { createClient } from '@/utils/supabase/server'

import { ApiResponse } from '@/types/supabase/api'
import { Grade, GradeRecord, User, CourseSession, Database } from '@/types/supabase/db'

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user }
}

function calculateGradeStats(records: GradeRecord[]) {
  const validGrades = records
    .filter((record) => !record.is_absent && record.value !== null)
    .map((record) => record.value as number)

  if (validGrades.length === 0) {
    return {
      stats_average_grade: 0,
      stats_highest_grade: 0,
      stats_lowest_grade: 0,
      stats_absent_count: records.filter((record) => record.is_absent).length,
      stats_total_students: records.length,
    }
  }

  return {
    stats_average_grade: validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length,
    stats_highest_grade: Math.max(...validGrades),
    stats_lowest_grade: Math.min(...validGrades),
    stats_absent_count: records.filter((record) => record.is_absent).length,
    stats_total_students: records.length,
  }
}

export async function getTeacherGrades(teacherId: string): Promise<ApiResponse> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    // Récupérer les grades avec les cours du professeur
    const { data: grades, error } = await supabase
      .schema('education')
      .from('grades')
      .select(`
        *,
        courses_sessions (
          *,
          courses_teacher!inner (
            teacher_id
          )
        ),
        grades_records (
          *,
          users:student_id (
            id,
            firstname,
            lastname,
            email
          )
        )
      `)
      .eq('courses_sessions.courses_teacher.teacher_id', teacherId)

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: grades,
      message: 'Notes récupérées avec succès',
    }
  } catch (error: any) {
    console.error('[GET_TEACHER_GRADES]', error)
    throw new Error('Erreur lors de la récupération des grades du prof')
  }
}

export async function createGradeRecord(
  data: Database['education']['Tables']['grades']['Insert']
): Promise<ApiResponse<null>> {
    await getSessionServer()
    const supabase = await createClient()

    try {
      const stats = calculateGradeStats(data.records)

    // Créer le grade principal
    const { data: grade, error: gradeError } = await supabase
      .schema('education')
      .from('grades')
      .insert({
        course_session_id: data.course_session_id,
        date: new Date(data.date).toISOString(),
        type: data.type,
        is_draft: data.is_draft,
        ...stats,
        last_update: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (gradeError || !grade) {
      throw new Error(`Erreur lors de la création du grade: ${gradeError?.message}`)
    }

    // Créer les enregistrements de notes
    const gradeRecords = data.records.map((record) => ({
      grade_id: grade.id,
      student_id: record.student_id,
      value: record.value,
      is_absent: record.is_absent,
      comment: record.comment,
    }))

    const { error: recordsError } = await supabase
      .schema('education')
      .from('grades_records')
      .insert(gradeRecords)

    if (recordsError) {
      throw new Error(`Erreur lors de la création des enregistrements: ${recordsError.message}`)
    }

    return {
      success: true,
      message: 'Note enregistrée avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[CREATE_GRADE_RECORD]', error)
    throw new Error('Erreur lors de la création du grade')
  }
}

export async function refreshGradeData(
  id?: string,
  fields?: string,
): Promise<ApiResponse<Grade | Grade[] | { stats_average_grade: number, stats_highest_grade: number, stats_lowest_grade: number, stats_absent_count: number, stats_total_students: number }>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    if (id && id !== 'grade') {
      console.log('🔍 Requête pour une note spécifique:', id)
      const { data: grades, error } = await supabase
        .schema('education')
        .from('grades')
        .select(`
          *,
          courses_sessions (*),
          grades_records (
            *,
            users:student_id (
              id,
              firstname,
              lastname,
              email
            )
          )
        `)
        .eq('id', id)
        .single()

      console.log('📦 Données reçues:', grades)
      console.log('❌ Erreur si présente:', error)

      if (error || !grades) {
        return {
          success: false,
          message: 'Note non trouvée',
          data: null,
        }
      }

      // Si on demande uniquement les stats
      if (fields === 'stats') {
        const stats = {
          stats_average_grade: grades.stats_average_grade,
          stats_highest_grade: grades.stats_highest_grade,
          stats_lowest_grade: grades.stats_lowest_grade,
          stats_absent_count: grades.stats_absent_count,
          stats_total_students: grades.stats_total_students,
        }
        return {
          success: true,
          message: 'Statistiques récupérées avec succès',
          data: stats,
        }
      }

      return {
        success: true,
        data: grades,
        message: 'Notes récupérées avec succès',
      }
    }

    // Si c'est une requête pour toutes les notes
   console.log('🔍 Requête pour toutes les notes')
    const { data: grades, error } = await supabase
      .schema('education')
      .from('grades')
      .select(`
        *,
        courses_sessions (*),
        grades_records (
          *,
          users:student_id (
            id,
            firstname,
            lastname,
            email
          )
        )
      `)
      .limit(50)

    console.log('📦 Données reçues:', grades)
    console.log('❌ Erreur si présente:', error)
    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: grades,
      message: 'Notes récupérées avec succès',
    }
  } catch (error: any) {
    console.error('[REFRESH_GRADE_DATA]', error)
    throw new Error('Erreur de la mise à jour des grades')
  }
}

export async function updateGradeRecord(
  gradeId: string,
  data: Database['education']['Tables']['grades']['Insert']
): Promise<ApiResponse<null>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    // Validation des données reçues
    if (!data.date || !data.type || !Array.isArray(data.records)) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Calculer les nouvelles statistiques
    const stats = calculateGradeStats(data.records)

    // Mise à jour de la note principale
    const { error: updateError } = await supabase
      .schema('education')
      .from('grades')
      .update({
        date: new Date(data.date).toISOString(),
        type: data.type,
        is_draft: data.is_draft,
        ...stats,
        last_update: new Date().toISOString(),
      })
      .eq('id', gradeId)

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    // Supprimer les anciens enregistrements
    await supabase
      .schema('education')
      .from('grades_records')
      .delete()
      .eq('grade_id', gradeId)

    // Créer les nouveaux enregistrements
    const newRecords = data.records.map((record) => ({
      grade_id: gradeId,
      student_id: record.student_id,
      value: record.value,
      is_absent: record.is_absent,
      comment: record.comment,
    }))

    const { error: insertError } = await supabase
      .schema('education')
      .from('grades_records')
      .insert(newRecords)

    if (insertError) {
      throw new Error(`Erreur lors de l'insertion: ${insertError.message}`)
    }

    return {
      success: true,
      data: null,
      message: 'Note mise à jour avec succès',
    }
  } catch (error: any) {
    console.error('[UPDATE_GRADE_RECORD]', error)
    throw new Error('Erreur lors de la mise à jour du grade')
  }
}
