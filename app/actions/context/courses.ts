'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'

import { ApiResponse } from '@/types/api'
import { CourseSession, TimeSlot } from '@/types/course'
import { SerializedValue, serializeData } from '@/lib/serialization'

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return user
}

export async function addStudentToCourse(
  courseId: string,
  studentId: string,
  timeSlot: {
    dayOfWeek: string
    startTime: string
    endTime: string
    subject: string
  },
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    const { dayOfWeek, startTime, endTime, subject } = timeSlot

    // Trouver la session correspondante
    const { data: session, error: sessionError } = await supabase
      .schema('education')
      .from('courses_sessions')
      .select('*')
      .eq('course_id', courseId)
      .eq('subject', subject)
      .single()

    if (sessionError || !session) {
      revalidatePath(`/courses/${courseId}`)
      return {
        success: false,
        message: 'Session non trouvée',
        data: null,
      }
    }

    // Vérifier si l'étudiant est déjà inscrit
    const { data: existingEnrollment } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select('id')
      .eq('course_sessions_id', session.id)
      .eq('student_id', studentId)
      .single()

    if (existingEnrollment) {
      return {
        success: false,
        message: 'Étudiant déjà inscrit à cette session',
        data: null,
      }
    }

    // Ajouter l'étudiant à la session
    const { error: enrollError } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .insert({
        course_sessions_id: session.id,
        student_id: studentId,
      })

    if (enrollError) {
      throw new Error(`Erreur lors de l'inscription: ${enrollError.message}`)
    }

    revalidatePath(`/courses/${courseId}`)

    return {
      success: true,
      data: null,
      message: 'Étudiant ajouté avec succès',
    }
  } catch (error: any) {
    console.error('[ADD_STUDENT_TO_COURSE]', error)
    throw new Error('Failed to add student to course')
  }
}

export async function checkTimeSlotOverlap(
  timeSlot: TimeSlot,
  userId: string,
  excludeCourseId?: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Récupérer tous les créneaux du professeur pour ce jour
    let query = supabase
      .schema('education')
      .from('courses_sessions_timeslot')
      .select(`
        *,
        courses_sessions (
          *,
          courses_teacher!inner (
            teacher_id
          )
        )
      `)
      .eq('day_of_week', timeSlot.dayOfWeek)
      .eq('courses_sessions.courses_teacher.teacher_id', userId)

    if (excludeCourseId) {
      query = query.neq('courses_sessions.course_id', excludeCourseId)
    }

    const { data: existingSlots, error } = await query

    if (error) {
      throw new Error(`Erreur lors de la vérification: ${error.message}`)
    }

    // Vérifier les chevauchements
    const newStartTime = timeToMinutes(timeSlot.startTime)
    const newEndTime = timeToMinutes(timeSlot.endTime)

    for (const slot of existingSlots || []) {
      const existingStartTime = timeToMinutes(slot.start_time)
      const existingEndTime = timeToMinutes(slot.end_time)

      // Il y a chevauchement si :
      // le nouveau cours commence avant la fin d'un cours existant
      // ET se termine après le début d'un cours existant
      if (newStartTime < existingEndTime && newEndTime > existingStartTime) {
        return {
          success: false,
          message: 'Ce créneau horaire est déjà occupé',
          data: { hasOverlap: true },
        }
      }
    }

    return {
      success: true,
      message: 'Aucun chevauchement rencontré',
      data: null,
    }
  } catch (error: any) {
    console.error('[CHECK_TIME_SLOT_OVERLAPS]', error)
    throw new Error('Failed to check time slot overlaps')
  }
}

export async function createCourse(
  courseData: {
    academicYear: string
    sessions: Array<{
      subject: string
      level: string
      timeSlots: Array<{
        dayOfWeek: string
        startTime: string
        endTime: string
        classroomNumber?: string
      }>
    }>
    teacherIds: string[]
  },
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Créer le cours principal
    const { data: course, error: courseError } = await supabase
      .schema('education')
      .from('courses')
      .insert({
        academic_year: courseData.academicYear,
        is_active: true,
      })
      .select()
      .single()

    if (courseError || !course) {
      throw new Error(`Erreur lors de la création du cours: ${courseError?.message}`)
    }

    // Associer les professeurs au cours
    const teacherInserts = courseData.teacherIds.map((teacherId) => ({
      course_id: course.id,
      teacher_id: teacherId,
    }))

    if (teacherInserts.length > 0) {
      const { error: teacherError } = await supabase
        .schema('education')
        .from('courses_teacher')
        .insert(teacherInserts)

      if (teacherError) {
        throw new Error(`Erreur lors de l'association des professeurs: ${teacherError.message}`)
      }
    }

    // Créer les sessions et leurs créneaux
    for (const sessionData of courseData.sessions) {
      const { data: session, error: sessionError } = await supabase
        .schema('education')
        .from('courses_sessions')
        .insert({
          course_id: course.id,
          subject: sessionData.subject,
          level: sessionData.level,
          stats_average_attendance: 0,
          stats_average_grade: 0,
          stats_average_behavior: 0,
          stats_last_updated: new Date().toISOString(),
        })
        .select()
        .single()

      if (sessionError || !session) {
        throw new Error(`Erreur lors de la création de la session: ${sessionError?.message}`)
      }

      // Créer les créneaux horaires pour cette session
      const timeslotInserts = sessionData.timeSlots.map((timeSlot) => ({
        course_sessions_id: session.id,
        day_of_week: timeSlot.dayOfWeek,
        start_time: timeSlot.startTime,
        end_time: timeSlot.endTime,
        classroom_number: timeSlot.classroomNumber || null,
      }))

      const { error: timeslotError } = await supabase
        .schema('education')
        .from('courses_sessions_timeslot')
        .insert(timeslotInserts)

      if (timeslotError) {
        throw new Error(`Erreur lors de la création des créneaux: ${timeslotError.message}`)
      }
    }

    return {
      success: true,
      message: 'Cours ajouté avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[CREATE_COURSE]', error)
    throw new Error('Failed to create course')
  }
}

export async function deleteCourse(courseId: string): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Marquer le cours comme inactif (soft delete)
    const { error } = await supabase
      .schema('education')
      .from('courses')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', courseId)

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return {
      success: true,
      message: 'Cours supprimé avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[DELETE_COURSE]', error)
    throw new Error('Failed to delete course')
  }
}

export async function getCourseById(
  id: string,
  fields?: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Récupérer la session avec le cours et les données associées
    const { data: session, error } = await supabase
      .schema('education')
      .from('courses_sessions')
      .select(`
        *,
        courses (
          *,
          courses_teacher (
            users:teacher_id (
              id,
              firstname,
              lastname,
              email
            )
          )
        ),
        courses_sessions_students (
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

    if (error || !session) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    // Si on demande uniquement les stats
    if (fields === 'stats') {
      const stats = await calculateCourseStats(id)
      return {
        success: true,
        data: stats ? serializeData(stats) : null,
        message: 'Statistiques récupérées avec succès',
      }
    }

    return {
      success: true,
      data: session ? serializeData(session) : null,
      message: 'Cours récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_COURSE_BY_ID]', error)
    throw new Error('Failed to fetch course by id')
  }
}

export async function getStudentCourses(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Récupérer tous les cours auxquels l'étudiant est inscrit
    const { data: enrollments, error } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select(`
        *,
        courses_sessions (
          *,
          courses (
            *,
            courses_teacher (
              users:teacher_id (
                id,
                firstname,
                lastname,
                email,
                subjects
              )
            )
          )
        )
      `)
      .eq('student_id', studentId)
      .eq('courses_sessions.courses.is_active', true)

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    if (!enrollments || enrollments.length === 0) {
      return {
        success: false,
        message: 'Aucun cours trouvé pour cet étudiant',
        data: null,
      }
    }

    return {
      success: true,
      data: enrollments ? serializeData(enrollments) : null,
      message: 'Cours récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_STUDENT_COURSES]', error)
    throw new Error('Failed to get student courses')
  }
}

export async function getTeacherCourses(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Récupérer tous les cours du professeur
    const { data: courses, error } = await supabase
      .schema('education')
      .from('courses_teacher')
      .select(`
        *,
        courses (
          *,
          courses_sessions (
            *,
            courses_sessions_students (
              users:student_id (
                id,
                firstname,
                lastname,
                email
              )
            )
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('courses.is_active', true)

    if (error) {
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    return {
      success: true,
      data: courses ? serializeData(courses) : null,
      message: 'Cours du prof récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_TEACHER_COURSES]', error)
    throw new Error('Failed to get teacher courses')
  }
}

export async function removeStudentFromCourse(
  courseId: string,
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Récupérer les IDs des sessions du cours
    const { data: sessions, error: sessionsError } = await supabase
      .schema('education')
      .from('courses_sessions')
      .select('id')
      .eq('course_id', courseId)

    if (sessionsError || !sessions?.length) {
      throw new Error(`Erreur lors de la récupération des sessions: ${sessionsError?.message}`)
    }

    const sessionIds = sessions.map((s) => s.id)

    // Supprimer l'étudiant de toutes les sessions du cours
    const { error } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .delete()
      .in('course_sessions_id', sessionIds)
      .eq('student_id', studentId)

    if (error) {
      throw new Error(`Erreur lors de la suppression: ${error.message}`)
    }

    return {
      success: true,
      message: 'Étudiant retiré du cours avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[REMOVE_STUDENT_FROM_COURSE]', error)
    throw new Error('Failed to remove student from course')
  }
}

export async function updateCourse(
  courseId: string,
  courseData: {
    sessions: Array<{
      id: string
      subject: string
      level: string
      timeSlot: {
        dayOfWeek: string
        startTime: string
        endTime: string
        classroomNumber?: string
      }
    }>
  },
  sameStudents: boolean,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Mettre à jour chaque session
    for (const sessionData of courseData.sessions) {
      // Mettre à jour la session
      const { error: sessionError } = await supabase
        .schema('education')
        .from('courses_sessions')
        .update({
          subject: sessionData.subject,
          level: sessionData.level,
          stats_last_updated: new Date().toISOString(),
        })
        .eq('id', sessionData.id)

      if (sessionError) {
        throw new Error(`Erreur lors de la mise à jour de la session: ${sessionError.message}`)
      }

      // Mettre à jour les créneaux horaires
      const { error: timeslotError } = await supabase
        .schema('education')
        .from('courses_sessions_timeslot')
        .update({
          day_of_week: sessionData.timeSlot.dayOfWeek,
          start_time: sessionData.timeSlot.startTime,
          end_time: sessionData.timeSlot.endTime,
          classroom_number: sessionData.timeSlot.classroomNumber || null,
        })
        .eq('course_sessions_id', sessionData.id)

      if (timeslotError) {
        throw new Error(`Erreur lors de la mise à jour du créneau: ${timeslotError.message}`)
      }
    }

    return {
      success: true,
      data: null,
      message: 'Cours mis à jour avec succès',
    }
  } catch (error: any) {
    console.error('[UPDATE_COURSE]', error)
    throw new Error('Failed to update course')
  }
}

export async function updateCourses(
  role: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    let courses

    if (['admin', 'bureau'].includes(role)) {
      // Admin peut voir tous les cours
      const { data: allCourses, error } = await supabase
        .schema('education')
        .from('courses')
        .select(`
          *,
          courses_teacher (
            users:teacher_id (
              id,
              firstname,
              lastname,
              email
            )
          ),
          courses_sessions (
            *,
            courses_sessions_students (
              users:student_id (
                id,
                firstname,
                lastname,
                email
              )
            )
          )
        `)
        .eq('is_active', true)

      if (error) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`)
      }
      courses = allCourses
    } else {
      // Professeur ne voit que ses cours
      const { data: teacherCourses, error } = await supabase
        .schema('education')
        .from('courses_teacher')
        .select(`
          *,
          courses (
            *,
            courses_sessions (
              *,
              courses_sessions_students (
                users:student_id (
                  id,
                  firstname,
                  lastname,
                  email
                )
              )
            )
          )
        `)
        .eq('teacher_id', userId)
        .eq('courses.is_active', true)

      if (error) {
        throw new Error(`Erreur lors de la récupération: ${error.message}`)
      }
      courses = teacherCourses?.map((tc) => tc.courses) || []
    }

    return {
      success: true,
      data: courses ? serializeData(courses) : null,
      message: 'Cours récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[UPDATE_COURSES]', error)
    throw new Error('Failed to update courses')
  }
}

export async function updateCourseSession(
  courseId: string,
  sessionIndex: number,
  sessionData: Partial<CourseSession>,
  role: string,
  userId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getAuthenticatedUser()
  const supabase = await createClient()

  try {
    // Vérifier que le cours existe et récupérer ses sessions
    const { data: course, error: courseError } = await supabase
      .schema('education')
      .from('courses')
      .select(`
        *,
        courses_teacher (teacher_id),
        courses_sessions (*)
      `)
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    // Vérifier les permissions
    if (role === 'teacher') {
      const isTeacher = course.courses_teacher.some((ct: any) => ct.teacher_id === userId)
      if (!isTeacher) {
        return {
          success: false,
          message: 'Vous n\'avez pas les droits pour modifier ce cours',
          data: null,
        }
      }
    }

    if (!['admin', 'bureau', 'teacher'].includes(role)) {
      return {
        success: false,
        message: 'Vous n\'avez pas les droits nécessaires',
        data: null,
      }
    }

    // Vérifier que la session existe
    if (!course.courses_sessions[sessionIndex]) {
      return {
        success: false,
        message: 'Session non trouvée',
        data: null,
      }
    }

    const sessionId = course.courses_sessions[sessionIndex].id

    // Mettre à jour la session
    const { error: updateError } = await supabase
      .schema('education')
      .from('courses_sessions')
      .update({
        ...sessionData,
        stats_last_updated: new Date().toISOString(),
      })
      .eq('id', sessionId)

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    return {
      success: true,
      data: null,
      message: 'Session mise à jour avec succès',
    }
  } catch (error: any) {
    console.error('[UPDATE_COURSE_SESSION]', error)
    throw new Error('Failed to update course session')
  }
}

async function calculateCourseStats(sessionId: string) {
  const supabase = await createClient()

  try {
    // Récupérer toutes les notes associées à cette session
    const { data: grades, error } = await supabase
      .schema('education')
      .from('grades')
      .select(`
        *,
        grades_records (*)
      `)
      .eq('course_session_id', sessionId)

    if (error || !grades || grades.length === 0) {
      return {
        averageGrade: 0,
        totalAbsences: 0,
        participationRate: 0,
      }
    }

    // Calculer les statistiques
    let totalGrades = 0
    let totalStudents = 0
    let totalAbsences = 0
    let totalParticipation = 0

    grades.forEach((grade) => {
      grade.grades_records?.forEach((record: any) => {
        if (record.is_absent) {
          totalAbsences++
        } else {
          totalGrades += record.value || 0
          totalParticipation++
        }
        totalStudents++
      })
    })

    return {
      averageGrade: totalParticipation > 0 ? totalGrades / totalParticipation : 0,
      totalAbsences,
      participationRate: totalStudents > 0 ? (totalParticipation / totalStudents) * 100 : 0,
    }
  } catch (error) {
    console.error('Error calculating course stats:', error)
    return {
      averageGrade: 0,
      totalAbsences: 0,
      participationRate: 0,
    }
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
