'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { Grade, GradeRecord } from '@/types/db'
import { CreateGradePayload, GradeStats } from '@/types/grade-payload'

export async function getTeacherGrades(teacherId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Étape 1: Récupérer les IDs des sessions de cours de l'enseignant
    const { data: coursesData, error: coursesError } = await supabase
      .schema('education')
      .from('courses')
      .select('courses_sessions(id), courses_teacher!inner(teacher_id)') // Jointure pour filtrer
      .eq('courses_teacher.teacher_id', teacherId)

    if (coursesError) {
      console.error(
        '******** Erreur Supabase (Etape 1 - cours) :',
        coursesError,
        '********',
      )
      throw new Error(
        `Erreur lors de la récupération des sessions de cours: ${coursesError.message}`,
      )
    }

    // Aplatir la liste des IDs de session
    const sessionIds =
      coursesData?.flatMap((course) =>
        course.courses_sessions.map((session) => session.id),
      ) || []

    if (sessionIds.length === 0) {
      return {
        success: true,
        data: [],
        message: 'Aucune note trouvée pour cet enseignant.',
      }
    }

    // Étape 2: Récupérer les notes pour ces sessions
    const { data: grades, error: gradesError } = await supabase
      .schema('education')
      .from('grades')
      .select(
        `
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
      `,
      )
      .in('course_session_id', sessionIds)

    if (gradesError) {
      console.error(
        '******** Erreur Supabase (Etape 2 - notes) :',
        gradesError,
        '********',
      )
      throw new Error(`Erreur lors de la récupération des notes: ${gradesError.message}`)
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
  data: CreateGradePayload,
): Promise<ApiResponse<null>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const stats = calculateGradeStats(data.records as GradeRecord[])

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

    revalidatePath('/courses/[courseId]/grades', 'page')
    revalidatePath('/courses/[courseId]', 'page')

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
): Promise<ApiResponse<Grade | Grade[] | GradeStats>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (id && id !== 'grade') {
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
  data: CreateGradePayload,
): Promise<ApiResponse<null>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

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
    const stats = calculateGradeStats(data.records as GradeRecord[])

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

    revalidatePath('/courses/[courseId]/grades', 'page')
    revalidatePath('/courses/[courseId]', 'page')

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

function calculateGradeStats(records: GradeRecord[]): GradeStats {
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
