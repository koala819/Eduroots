'use server'

import { createClient } from '@/utils/supabase/server'

import { ApiResponse } from '@/types/api'
import { CreateGradeDTO, PopulatedGrade, UpdateGradeDTO } from '@/types/grade'
import { SerializedValue, serializeData } from '@/lib/serialization'

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user }
}

function calculateGradeStats(records: any[]) {
  const validGrades = records
    .filter((record) => !record.isAbsent && record.value !== null)
    .map((record) => record.value)

  if (validGrades.length === 0) {
    return {
      stats_average_grade: 0,
      stats_highest_grade: 0,
      stats_lowest_grade: 0,
      stats_absent_count: records.filter((record) => record.isAbsent).length,
      stats_total_students: records.length,
    }
  }

  return {
    stats_average_grade: validGrades.reduce((sum, grade) => sum + grade, 0) / validGrades.length,
    stats_highest_grade: Math.max(...validGrades),
    stats_lowest_grade: Math.min(...validGrades),
    stats_absent_count: records.filter((record) => record.isAbsent).length,
    stats_total_students: records.length,
  }
}

export async function getTeacherGrades(teacherId: string): Promise<ApiResponse<SerializedValue>> {
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

    const populatedGrades = grades?.map((grade) => ({
      id: grade.id,
      isDraft: grade.is_draft,
      sessionId: grade.course_session_id,
      course: {
        ...grade.courses_sessions,
        id: grade.courses_sessions?.id,
      },
      date: grade.date,
      type: grade.type,
      stats: {
        averageGrade: grade.stats_average_grade,
        highestGrade: grade.stats_highest_grade,
        lowestGrade: grade.stats_lowest_grade,
        absentCount: grade.stats_absent_count,
        totalStudents: grade.stats_total_students,
      },
      records: grade.grades_records?.map((record: any) => ({
        value: record.value,
        isAbsent: record.is_absent,
        comment: record.comment,
        student: {
          ...record.users,
          id: record.users?.id,
        },
      })) || [],
      createdAt: grade.created_at,
      updatedAt: grade.updated_at,
      isActive: grade.is_active,
    })) || []

    return {
      success: true,
      data: populatedGrades ? serializeData(populatedGrades) : null,
      message: 'Notes récupérées avec succès',
    }
  } catch (error: any) {
    console.error('[GET_TEACHER_GRADES]', error)
    throw new Error('Erreur lors de la récupération des grades du prof')
  }
}

export async function createGradeRecord(
  data: CreateGradeDTO,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    const stats = calculateGradeStats(data.records)

    // Créer le grade principal
    const { data: grade, error: gradeError } = await supabase
      .schema('education')
      .from('grades')
      .insert({
        course_session_id: data.course,
        date: new Date(data.date).toISOString(),
        type: data.type,
        is_draft: data.isDraft,
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
      student_id: record.student,
      value: record.value,
      is_absent: record.isAbsent,
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
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

  try {
    if (id && id !== 'grade') {
      const { data: grade, error } = await supabase
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

      if (error || !grade) {
        return {
          success: false,
          message: 'Note non trouvée',
          data: null,
        }
      }

      // Si on demande uniquement les stats
      if (fields === 'stats') {
        const stats = {
          averageGrade: grade.stats_average_grade,
          highestGrade: grade.stats_highest_grade,
          lowestGrade: grade.stats_lowest_grade,
          absentCount: grade.stats_absent_count,
          totalStudents: grade.stats_total_students,
        }
        return {
          success: true,
          message: 'Statistiques récupérées avec succès',
          data: stats ? serializeData(stats) : null,
        }
      }

      // Transformation en PopulatedGrade
      const formattedGrade: PopulatedGrade = {
        id: grade.id,
        sessionId: grade.course_session_id,
        course: {
          ...grade.courses_sessions,
          id: grade.courses_sessions?.id,
        },
        date: grade.date,
        type: grade.type,
        isDraft: grade.is_draft,
        records: grade.grades_records?.map((record: any) => ({
          value: record.value,
          isAbsent: record.is_absent,
          comment: record.comment,
          student: {
            ...record.users,
            id: record.users?.id,
          },
        })) || [],
        stats: {
          averageGrade: grade.stats_average_grade,
          highestGrade: grade.stats_highest_grade,
          lowestGrade: grade.stats_lowest_grade,
          absentCount: grade.stats_absent_count,
          totalStudents: grade.stats_total_students,
        },
        createdAt: grade.created_at,
        updatedAt: grade.updated_at,
        isActive: grade.is_active,
      }

      return {
        success: true,
        data: formattedGrade ? serializeData(formattedGrade) : null,
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
          student_id,
          users!grades_records_student_id_fkey (
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


    const formattedGrades: PopulatedGrade[] = grades?.map((grade) => ({
      id: grade.id,
      sessionId: grade.course_session_id,
      course: {
        ...grade.courses_sessions,
        id: grade.courses_sessions?.id,
      },
      date: grade.date,
      type: grade.type,
      isDraft: grade.is_draft,
      records: grade.grades_records?.map((record: any) => ({
        value: record.value,
        isAbsent: record.is_absent,
        comment: record.comment,
        student: {
          ...record.users,
          id: record.users?.id,
        },
      })) || [],
      stats: {
        averageGrade: grade.stats_average_grade,
        highestGrade: grade.stats_highest_grade,
        lowestGrade: grade.stats_lowest_grade,
        absentCount: grade.stats_absent_count,
        totalStudents: grade.stats_total_students,
      },
      createdAt: grade.created_at,
      updatedAt: grade.updated_at,
      isActive: grade.is_active,
    })) || []

    return {
      success: true,
      data: formattedGrades ? serializeData(formattedGrades) : null,
      message: 'Notes récupérées avec succès',
    }
  } catch (error: any) {
    console.error('[REFRESH_GRADE_DATA]', error)
    throw new Error('Erreur de la mise à jour des grades')
  }
}

export async function updateGradeRecord(
  gradeId: string,
  data: UpdateGradeDTO,
): Promise<ApiResponse<SerializedValue>> {
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
        is_draft: data.isDraft,
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
      student_id: record.student,
      value: record.value,
      is_absent: record.isAbsent,
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
