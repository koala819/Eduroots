'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { ApiResponse } from '@/types/supabase/api'
import { CreateBehaviorPayload, UpdateBehaviorPayload } from '@/types/behavior'
import { SerializedValue, serializeData } from '@/lib/serialization'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return user
}

export async function createBehaviorRecord(
  data: CreateBehaviorPayload,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { course, sessionId, date, records } = data

    // Validation des données requises
    if (!course || !date || !Array.isArray(records)) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Vérification si un enregistrement existe déjà pour ce cours à cette date
    const startOfDay = new Date(new Date(date).setHours(0, 0, 0, 0)).toISOString()
    const endOfDay = new Date(new Date(date).setHours(23, 59, 59, 999)).toISOString()

    const { data: existingBehavior } = await supabase
      .schema('education')
      .from('behaviors')
      .select('id')
      .eq('course_id', course)
      .gte('date', startOfDay)
      .lte('date', endOfDay)
      .single()

    if (existingBehavior) {
      return {
        success: false,
        message: 'Un enregistrement existe déjà pour ce cours à cette date',
        data: null,
      }
    }

    // Calcul des statistiques
    const totalStudents = records.length
    const behaviorRate = records.reduce((acc, record) => acc + record.rating, 0) / totalStudents

    // Créer l'enregistrement de comportement
    const { data: behavior, error: behaviorError } = await supabase
      .schema('education')
      .from('behaviors')
      .insert({
        course_id: course,
        date: new Date(date).toISOString(),
        behavior_rate: behaviorRate,
        total_students: totalStudents,
        last_update: new Date().toISOString(),
        is_active: true,
      })
      .select()
      .single()

    if (behaviorError || !behavior) {
      throw new Error(`Erreur lors de la création du comportement: ${behaviorError?.message}`)
    }

    // Créer les enregistrements de comportement pour chaque étudiant
    const behaviorRecords = records.map((record) => ({
      behavior_id: behavior.id,
      student_id: record.student,
      rating: record.rating,
      comment: record.comment || null,
    }))

    const { error: recordsError } = await supabase
      .schema('education')
      .from('behavior_records')
      .insert(behaviorRecords)

    if (recordsError) {
      throw new Error(`Erreur lors de la création des enregistrements: ${recordsError.message}`)
    }

    // Mise à jour des statistiques étudiants
    const updatePromises = records.map(async (record: any) => {
      const studentId = record.student

      // Récupérer toutes les évaluations de comportement de l'étudiant
      const { data: studentBehaviors } = await supabase
        .schema('education')
        .from('behavior_records')
        .select('rating')
        .eq('student_id', studentId)

      // Calculer la nouvelle moyenne
      const allRatings = [...(studentBehaviors?.map((b) => b.rating) || []), record.rating]
      const behaviorAverage = allRatings
        .reduce((sum, rating) => sum + rating, 0) / allRatings.length

      // Mettre à jour ou créer les stats de l'étudiant
      const { data: existingStats } = await supabase
        .schema('stats')
        .from('student_stats')
        .select('*')
        .eq('user_id', studentId)
        .single()

      if (existingStats) {
        await supabase
          .schema('stats')
          .from('student_stats')
          .update({
            behavior_average: behaviorAverage,
            last_activity: new Date().toISOString(),
            last_update: new Date().toISOString(),
          })
          .eq('user_id', studentId)
      } else {
        await supabase
          .schema('stats')
          .from('student_stats')
          .insert({
            user_id: studentId,
            absences_rate: 0,
            absences_count: 0,
            behavior_average: behaviorAverage,
            last_activity: new Date().toISOString(),
            last_update: new Date().toISOString(),
          })
      }
    })

    await Promise.all(updatePromises)

    // Mise à jour des statistiques de session si sessionId est fourni
    if (sessionId) {
      // Calculer la moyenne de comportement pour cette session
      const { data: sessionBehaviors } = await supabase
        .schema('education')
        .from('behaviors')
        .select('behavior_rate')
        .eq('course_id', course)

      if (sessionBehaviors && sessionBehaviors.length > 0) {
        const sessionBehaviorRate = sessionBehaviors
          .reduce((sum, beh) => sum + beh.behavior_rate, 0) / sessionBehaviors.length

        // Mettre à jour les stats de la session
        await supabase
          .schema('education')
          .from('courses_sessions')
          .update({
            stats_average_behavior: sessionBehaviorRate,
            stats_last_updated: new Date().toISOString(),
          })
          .eq('id', sessionId)
      }
    }

    // Mise à jour des statistiques globales
    const { data: allBehaviors } = await supabase
      .schema('education')
      .from('behaviors')
      .select('behavior_rate')

    if (allBehaviors && allBehaviors.length > 0) {
      // const averageBehaviorRate = allBehaviors
      //   .reduce((sum, beh) => sum + beh.behavior_rate, 0) / allBehaviors.length

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
            last_update: new Date().toISOString(),
          })
          .eq('id', globalStats.id)
      }
    }

    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Comportement et statistiques enregistrés avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[CREATE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to create behavior record')
  }
}

export async function deleteBehaviorRecord(id: string): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    if (!id) {
      return {
        success: false,
        message: 'ID invalide',
        data: null,
      }
    }

    // Supprimer d'abord les enregistrements liés
    const { error: recordsError } = await supabase
      .schema('education')
      .from('behavior_records')
      .delete()
      .eq('behavior_id', id)

    if (recordsError) {
      throw new Error(`Erreur lors de la suppression des enregistrements: ${recordsError.message}`)
    }

    // Puis supprimer l'enregistrement principal
    const { error: behaviorError } = await supabase
      .schema('education')
      .from('behaviors')
      .delete()
      .eq('id', id)

    if (behaviorError) {
      throw new Error(`Erreur lors de la suppression du comportement: ${behaviorError.message}`)
    }

    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Comportement supprimé avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[DELETE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to delete behavior record')
  }
}

export async function fetchBehaviorsByCourse(
  courseId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: behaviors, error } = await supabase
      .schema('education')
      .from('behaviors')
      .select(`
        *,
        behavior_records (
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

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: behaviors ? serializeData(behaviors) : null,
      message: 'Comportements récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[FETCH_BEHAVIORS_BY_COURSE]', error)
    throw new Error('Failed to fetch behaviors')
  }
}

export async function getBehaviorByIdAndDate(
  courseId: string,
  date: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    let query = supabase
      .schema('education')
      .from('behaviors')
      .select(`
        *,
        behavior_records (
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

    if (date) {
      const searchDate = date.split('T')[0]
      query = query.gte('date', `${searchDate}T00:00:00.000Z`)
        .lt('date', `${searchDate}T23:59:59.999Z`)
    }

    const { data: behaviors, error } = date ?
      await query.single() :
      await query

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: behaviors ? serializeData(behaviors) : null,
      message: 'Comportement récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_BEHAVIOR_BY_ID]', error)
    throw new Error('Failed to fetch behavior by id')
  }
}

export async function getStudentBehaviorHistory(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { data: behaviors, error } = await supabase
      .schema('education')
      .from('behavior_records')
      .select(`
        *,
        behaviors (
          *,
          courses_sessions (
            id,
            subject,
            level,
            course_id,
            courses (
              id,
              academic_year
            )
          )
        )
      `)
      .eq('student_id', studentId)

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    // Formater les données pour correspondre à l'ancien format
    const formattedBehaviors = behaviors?.map((record) => ({
      id: record.behaviors?.id,
      date: record.behaviors?.date,
      records: [record], // Le record actuel
      stats: {
        behaviorRate: record.behaviors?.behavior_rate,
        totalStudents: record.behaviors?.total_students,
        lastUpdate: record.behaviors?.last_update,
      },
      courseDetails: {
        id: record.behaviors?.courses_sessions?.courses?.id,
        academicYear: record.behaviors?.courses_sessions?.courses?.academic_year,
        session: {
          id: record.behaviors?.courses_sessions?.id,
          subject: record.behaviors?.courses_sessions?.subject,
          level: record.behaviors?.courses_sessions?.level,
        },
      },
    })) || []

    return {
      success: true,
      data: formattedBehaviors ? serializeData(formattedBehaviors) : null,
      message: 'Comportement de l\'étudiant récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_STUDENT_BEHAVIOR_HISTORY]', error)
    throw new Error('Erreur lors de la récupération du cours')
  }
}

export async function updateBehaviorRecord(
  data: UpdateBehaviorPayload,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { courseId, records, behaviorId, sessionId, date } = data

    if (!courseId || !Array.isArray(records) || !behaviorId || !sessionId || !date) {
      return {
        success: false,
        message: 'Données invalides',
        data: null,
      }
    }

    // Récupérer l'ancien enregistrement
    const { data: oldBehavior, error: fetchError } = await supabase
      .schema('education')
      .from('behaviors')
      .select(`
        *,
        behavior_records (*)
      `)
      .eq('id', behaviorId)
      .single()

    if (fetchError || !oldBehavior) {
      return {
        success: false,
        message: 'Comportement non trouvé',
        data: null,
      }
    }

    // Calculer les nouvelles statistiques
    const totalStudents = records.length
    const behaviorRate = records.reduce((acc, record) => acc + record.rating, 0) / totalStudents

    // Mettre à jour l'enregistrement principal
    const { error: updateError } = await supabase
      .schema('education')
      .from('behaviors')
      .update({
        behavior_rate: behaviorRate,
        total_students: totalStudents,
        last_update: new Date().toISOString(),
      })
      .eq('id', behaviorId)

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    // Supprimer les anciens enregistrements
    await supabase
      .schema('education')
      .from('behavior_records')
      .delete()
      .eq('behavior_id', behaviorId)

    // Créer les nouveaux enregistrements
    const newRecords = records.map((record: any) => ({
      behavior_id: behaviorId,
      student_id: record.student,
      rating: record.rating,
      comment: record.comment || null,
    }))

    const { error: insertError } = await supabase
      .schema('education')
      .from('behavior_records')
      .insert(newRecords)

    if (insertError) {
      throw new Error(`Erreur lors de l'insertion: ${insertError.message}`)
    }

    // Mettre à jour les statistiques étudiants
    const updatePromises = records.map(async (record: any) => {
      const studentId = record.student

      // Récupérer toutes les évaluations de comportement de l'étudiant
      const { data: studentBehaviors } = await supabase
        .schema('education')
        .from('behavior_records')
        .select('rating')
        .eq('student_id', studentId)

      if (studentBehaviors && studentBehaviors.length > 0) {
        const behaviorAverage = studentBehaviors
          .reduce((sum, b) => sum + b.rating, 0) / studentBehaviors.length

        await supabase
          .schema('stats')
          .from('student_stats')
          .update({
            behavior_average: behaviorAverage,
            last_activity: new Date().toISOString(),
            last_update: new Date().toISOString(),
          })
          .eq('user_id', studentId)
      }
    })

    await Promise.all(updatePromises)

    revalidatePath('/courses/[courseId]/behavior')
    revalidatePath('/courses/[courseId]')

    return {
      success: true,
      message: 'Fiche de comportement et statistiques mises à jour avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[UPDATE_BEHAVIOR_RECORD]', error)
    throw new Error('Failed to update behavior record')
  }
}
