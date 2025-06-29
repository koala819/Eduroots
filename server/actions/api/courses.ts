'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import {
  AddStudentToCoursePayload,
  CreateCoursePayload,
  UpdateCoursePayload,
  UpdateCourseSessionPayload,
} from '@/types/course-payload'
import {
  CourseWithRelations,
  SubjectNameEnum,
  TimeSlotEnum,
} from '@/types/courses'
import {
  CourseSessionTimeslot,
} from '@/types/db'

export async function addStudentToCourse(
  courseId: string,
  studentId: string,
  timeSlot: AddStudentToCoursePayload['timeSlot'],
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { subject } = timeSlot

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
  timeSlot: Pick<
    CourseSessionTimeslot,
    'day_of_week' | 'start_time' | 'end_time'
  >,
  userId: string,
  excludeCourseId?: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    let query = supabase
      .schema('education')
      .from('courses_sessions_timeslot')
      .select(
        `
        *,
        courses_sessions (
          *,
          courses_teacher!inner (
            teacher_id
          )
        )
      `,
      )
      .eq('day_of_week', timeSlot.day_of_week)
      .eq('courses_sessions.courses_teacher.teacher_id', userId)

    if (excludeCourseId) {
      query = query.neq('courses_sessions.course_id', excludeCourseId)
    }

    const { data: existingSlots, error } = await query

    if (error) {
      throw new Error(`Erreur lors de la vérification: ${error.message}`)
    }

    const newStartTime = timeToMinutes(timeSlot.start_time)
    const newEndTime = timeToMinutes(timeSlot.end_time)

    for (const slot of existingSlots ?? []) {
      const existingStartTime = timeToMinutes(slot.start_time)
      const existingEndTime = timeToMinutes(slot.end_time)

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
  courseData: CreateCoursePayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // 1. Insérer le cours
    const { data: course, error: courseError } = await supabase
      .schema('education')
      .from('courses')
      .insert(courseData)
      .select()
      .single()

    if (courseError || !course) {
      throw new Error(
        `Erreur lors de la création du cours: ${courseError?.message}`,
      )
    }

    // 2. Insérer les relations profs-cours
    const teacherRelations = courseData.teacherIds.map((teacherId) => ({
      course_id: course.id,
      teacher_id: teacherId,
    }))

    if (teacherRelations.length > 0) {
      const { error: teacherError } = await supabase
        .schema('education')
        .from('courses_teacher')
        .insert(teacherRelations)

      if (teacherError) {
        throw new Error(
          `Erreur lors de l'association des professeurs: ${teacherError.message}`,
        )
      }
    }

    // 3. Insérer les sessions et leurs créneaux
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
        throw new Error(
          `Erreur lors de la création de la session: ${sessionError?.message}`,
        )
      }

      // Insérer les créneaux
      const timeSlots = sessionData.timeSlots.map((slot) => ({
        course_sessions_id: session.id,
        day_of_week: slot.day_of_week,
        start_time: slot.start_time,
        end_time: slot.end_time,
        classroom_number: slot.classroom_number,
      }))

      const { error: timeslotError } = await supabase
        .schema('education')
        .from('courses_sessions_timeslot')
        .insert(timeSlots)

      if (timeslotError) {
        throw new Error(
          `Erreur lors de la création des créneaux: ${timeslotError.message}`,
        )
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

export async function deleteCourse(courseId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
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

export async function getAllCourses(): Promise<ApiResponse<CourseWithRelations[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: courses, error } = await supabase
      .schema('education')
      .from('courses')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('[GET_ALL_COURSES]', error)
      return {
        success: false,
        message: 'Erreur lors de la récupération des cours',
        data: null,
      }
    }

    return {
      success: true,
      data: courses,
      message: 'Cours récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_ALL_COURSES]', error)
    throw new Error('Failed to get all courses')
  }
}

export async function getCourseSessionById(
  id: string,
  fields?: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    await supabase
      .schema('education')
      .from('courses_sessions')
      .select('id, subject, level')
      .eq('id', id)

    // console.log('\n\n\n1. Récupération de la session de base\n\n\n with id:', id)
    const { data: sessions, error: sessionError } = await supabase
      .schema('education')
      .from('courses_sessions')
      .select('*')
      .eq('id', id)
      .limit(1)

    const session = sessions?.[0]

    if (sessionError || !session) {
      console.error('[GET_COURSE_BY_ID] Session Error:', sessionError)
      return {
        success: false,
        message: 'Session non trouvée',
        data: null,
      }
    }

    // Récupération du cours

    const { data: courses, error: courseError } = await supabase
      .schema('education')
      .from('courses')
      .select('*')
      .eq('id', session.course_id)
      .limit(1)

    const course = courses?.[0]

    if (courseError) {
      console.error('[GET_COURSE_BY_ID] Course Error:', courseError)
    }

    // Récupération des horaires
    const { data: timeslots, error: timeslotError } = await supabase
      .schema('education')
      .from('courses_sessions_timeslot')
      .select('*')
      .eq('course_sessions_id', id)

    if (timeslotError) {
      console.error('[GET_COURSE_BY_ID] Timeslot Error:', timeslotError)
    }

    // Récupération des étudiants
    const { data: students, error: studentsError } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select('*')
      .eq('course_sessions_id', id)

    if (studentsError) {
      console.error('[GET_COURSE_BY_ID] Students Error:', studentsError)
    }

    // Nettoyage des étudiants invalides
    await cleanInvalidStudents(supabase, students ?? [])

    // Récupération des informations des utilisateurs
    const studentsWithUsers = await getStudentsWithUsers(supabase, students ?? [])

    const response = {
      ...session,
      courses: course,
      courses_sessions_timeslot: timeslots,
      courses_sessions_students: studentsWithUsers,
    }

    if (fields === 'stats') {
      const stats = await calculateCourseStats(id)
      return {
        success: true,
        data: stats,
        message: 'Statistiques récupérées avec succès',
      }
    }

    return {
      success: true,
      data: response,
      message: 'Cours récupéré avec succès',
    }
  } catch (error: any) {
    console.error('[GET_COURSE_BY_ID]', error)
    throw new Error('Failed to fetch course by id')
  }
}

export async function getStudentCourses(
  studentId: string,
): Promise<ApiResponse<CourseWithRelations[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: enrollments, error } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select(
        `
        *,
        courses_sessions (
          *,
          courses_sessions_timeslot (
            day_of_week,
            start_time,
            end_time,
            classroom_number
          ),
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
      `,
      )
      .eq('student_id', studentId)
      .eq('courses_sessions.courses.is_active', true)

    if (error) {
      console.log(`Erreur lors de la récupération: ${error.message}`)
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
      data: enrollments,
      message: 'Cours récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_STUDENT_COURSES]', error)
    throw new Error('Failed to get student courses')
  }
}

export async function getTeacherCourses(
  teacherId: string,
): Promise<ApiResponse<CourseWithRelations[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: courses, error } = await supabase
      .schema('education')
      .from('courses')
      .select(
        `
        *,
        courses_teacher!inner (
          teacher_id
        ),
        courses_sessions (
          id,
          subject,
          level,
          courses_sessions_timeslot (
            day_of_week,
            start_time,
            end_time,
            classroom_number
         ),
          courses_sessions_students (
            id,
            student_id
          )
        )
      `,
      )
      .eq('is_active', true)
      .eq('courses_teacher.teacher_id', teacherId)

    if (error) {
      console.log(`Erreur lors de la récupération: ${error.message}`)
    }

    // Récupérer les données des utilisateurs séparément
    if (courses && courses.length > 0) {
      const allStudentIds = new Set<string>()

      // Collecter tous les student_ids
      courses.forEach((course) => {
        course.courses_sessions?.forEach((session: any) => {
          session.courses_sessions_students?.forEach((student: any) => {
            allStudentIds.add(student.student_id)
          })
        })
      })

      // Récupérer les données des utilisateurs
      const { data: users, error: usersError } = await supabase
        .schema('education')
        .from('users')
        .select('id, firstname, lastname, email, gender')
        .in('id', Array.from(allStudentIds))

      if (usersError) {
        console.error('Erreur lors de la récupération des utilisateurs:', usersError)
      }

      // Créer un map pour un accès rapide
      const usersMap = new Map()
      users?.forEach((user) => {
        usersMap.set(user.id, user)
      })

      // Enrichir les données avec les informations des utilisateurs
      courses.forEach((course) => {
        course.courses_sessions?.forEach((session: any) => {
          session.courses_sessions_students?.forEach((student: any) => {
            const userData = usersMap.get(student.student_id)
            if (userData) {
              (student as any).users = userData
            }
          })
        })
      })
    }

    return {
      success: true,
      data: courses ?? [],
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
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: sessions, error: sessionsError } = await supabase
      .schema('education')
      .from('courses_sessions')
      .select('id')
      .eq('course_id', courseId)

    if (sessionsError || !sessions?.length) {
      throw new Error(
        `Erreur lors de la récupération des sessions: ${sessionsError?.message}`,
      )
    }

    const sessionIds = sessions.map((s: { id: string }) => s.id)

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
  courseData: UpdateCoursePayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    for (const sessionData of courseData.sessions) {
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
        throw new Error(
          `Erreur lors de la mise à jour de la session: ${sessionError.message}`,
        )
      }

      const { error: timeslotError } = await supabase
        .schema('education')
        .from('courses_sessions_timeslot')
        .update({
          day_of_week: sessionData.timeSlot.day_of_week,
          start_time: sessionData.timeSlot.start_time,
          end_time: sessionData.timeSlot.end_time,
          classroom_number: sessionData.timeSlot.classroom_number ?? null,
        })
        .eq('course_sessions_id', sessionData.id)

      if (timeslotError) {
        throw new Error(
          `Erreur lors de la mise à jour du créneau: ${timeslotError.message}`,
        )
      }
    }

    // Récupérer le cours mis à jour
    const { data: updatedCourse, error: fetchError } = await supabase
      .schema('education')
      .from('courses')
      .select(
        `
        *,
        courses_teacher (
          *,
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
            *,
            users:student_id (
              id,
              firstname,
              lastname,
              email
            )
          ),
          courses_sessions_timeslot (*)
        )
      `,
      )
      .eq('id', courseData.sessions[0].id)
      .single()

    if (fetchError) {
      throw new Error(
        `Erreur lors de la récupération du cours mis à jour: ${fetchError.message}`,
      )
    }

    return {
      success: true,
      data: updatedCourse,
      message: 'Cours mis à jour avec succès',
    }
  } catch (error: any) {
    console.error('[UPDATE_COURSE]', error)
    throw new Error('Failed to update course')
  }
}

export async function updateCourses(
  userRole: string,
  userId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    let query

    if (userRole === 'teacher') {
      // Pour un prof, on ne regarde que ses cours
      query = supabase
        .schema('education')
        .from('courses')
        .select(
          `
          *,
          courses_teacher!inner (
            *,
            users (
              id,
              firstname,
              lastname,
              email
            )
          ),
          courses_sessions (
            *,
            courses_sessions_timeslot (*)
          )
        `,
        )
        .eq('is_active', true)
        .eq('courses_teacher.teacher_id', userId)
    } else if (userRole === 'student') {
      // Pour un étudiant, on ne regarde que ses cours
      // D'abord, récupérer les IDs des sessions auxquelles l'étudiant est inscrit
      const { data: studentSessions, error: sessionsError } = await supabase
        .schema('education')
        .from('courses_sessions_students')
        .select('course_sessions_id')
        .eq('student_id', userId)

      if (sessionsError) {
        throw new Error(`Erreur lors de la récupération des sessions: ${sessionsError.message}`)
      }

      if (!studentSessions || studentSessions.length === 0) {
        return {
          success: true,
          data: [],
          message: 'Aucun cours trouvé pour cet étudiant',
        }
      }

      const sessionIds = studentSessions.map((s) => s.course_sessions_id)

      // Récupérer les IDs des cours correspondants
      const { data: courseIds, error: courseIdsError } = await supabase
        .schema('education')
        .from('courses_sessions')
        .select('course_id')
        .in('id', sessionIds)

      if (courseIdsError) {
        throw new Error(`Erreur lors de la récupération des cours: ${courseIdsError.message}`)
      }

      if (!courseIds || courseIds.length === 0) {
        return {
          success: true,
          data: [],
          message: 'Aucun cours trouvé pour cet étudiant',
        }
      }

      const uniqueCourseIds = [...new Set(courseIds.map((c) => c.course_id))]

      // Maintenant récupérer les cours avec leurs relations
      query = supabase
        .schema('education')
        .from('courses')
        .select(
          `
          *,
          courses_sessions (
            *,
            courses_sessions_students (
              *
            ),
            courses_sessions_timeslot (*)
          )
        `,
        )
        .eq('is_active', true)
        .in('id', uniqueCourseIds)
    } else {
      // Pour admin/bureau, on voit tout
      query = supabase
        .schema('education')
        .from('courses')
        .select(
          `
          *,
          courses_teacher (
            *,
            users (
              id,
              firstname,
              lastname,
              email
            )
          ),
          courses_sessions (
            *,
            courses_sessions_students (
              *
            ),
            courses_sessions_timeslot (*)
          )
        `,
        )
        .eq('is_active', true)
    }

    const { data: courses, error } = await query

    if (error) {
      throw new Error(error.message)
    }

    // S'assurer que data est toujours un tableau
    const coursesData = courses || []

    return {
      success: true,
      data: coursesData,
      message: 'Courses updated successfully',
    }
  } catch (error: any) {
    console.error('[UPDATE_COURSES] Erreur complète:', error)
    throw new Error('Failed to update courses')
  }
}

export async function updateCourseSession(
  courseId: string,
  sessionIndex: number,
  sessionData: UpdateCourseSessionPayload['sessionData'],
  role: string,
  userId: string,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: course, error: courseError } = await supabase
      .schema('education')
      .from('courses')
      .select(
        `
        *,
        courses_teacher (teacher_id),
        courses_sessions (*)
      `,
      )
      .eq('id', courseId)
      .single()

    if (courseError || !course) {
      return {
        success: false,
        message: 'Cours non trouvé',
        data: null,
      }
    }

    if (role === 'teacher') {
      const isTeacher = course.courses_teacher.some(
        (ct: any) => ct.teacher_id === userId,
      )
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

    if (!course.courses_sessions[sessionIndex]) {
      return {
        success: false,
        message: 'Session non trouvée',
        data: null,
      }
    }

    const sessionId = course.courses_sessions[sessionIndex].id

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
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: grades, error } = await supabase
      .schema('education')
      .from('grades')
      .select(
        `
        *,
        grades_records (*)
      `,
      )
      .eq('course_session_id', sessionId)

    if (error || !grades || grades.length === 0) {
      return {
        averageGrade: 0,
        totalAbsences: 0,
        participationRate: 0,
      }
    }

    let totalGrades = 0
    let totalStudents = 0
    let totalAbsences = 0
    let totalParticipation = 0

    type GradeRecord = {
      is_absent: boolean
      value: number | null
    }

    grades.forEach((grade: { grades_records?: GradeRecord[] }) => {
      grade.grades_records?.forEach((record: any) => {
        if (record.is_absent) {
          totalAbsences++
        } else {
          totalGrades += record.value ?? 0
          totalParticipation++
        }
        totalStudents++
      })
    })

    return {
      averageGrade:
        totalParticipation > 0 ? totalGrades / totalParticipation : 0,
      totalAbsences,
      participationRate:
        totalStudents > 0 ? (totalParticipation / totalStudents) * 100 : 0,
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

async function cleanInvalidStudents(supabase: any, students: any[]) {
  const invalidStudents = students?.filter((student) => !student.student_id) || []
  if (invalidStudents.length === 0) return

  console.warn(`[GET_COURSE_BY_ID] ${invalidStudents.length} étudiants invalides trouvés`)

  for (const student of invalidStudents) {
    const { data: users, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id')
      .eq('mongo_id', student.mongo_student_id)
      .limit(1)

    const user = users?.[0]

    if (userError || !user) {
      console.warn(`[GET_COURSE_BY_ID] Suppression de l'étudiant ${student.mongo_student_id}
        (n'existe pas dans users)`)
      const { error: deleteError } = await supabase
        .schema('education')
        .from('courses_sessions_students')
        .delete()
        .eq('id', student.id)

      if (deleteError) {
        console.error('[GET_COURSE_BY_ID] Erreur lors de la suppression:', deleteError)
      }
    } else {
      console.error(`[GET_COURSE_BY_ID] Erreur de données: étudiant ${student.mongo_student_id}
        existe dans users mais n'a pas de student_id`)
    }
  }
}

async function getStudentsWithUsers(supabase: any, students: any[]) {
  return Promise.all(
    students?.filter((student) => student.student_id).map(async (student) => {
      const { data: users, error: userError } = await supabase
        .schema('education')
        .from('users')
        .select('*')
        .eq('id', student.student_id)
        .limit(1)

      const user = users?.[0]

      if (userError) {
        console.error('[GET_COURSE_BY_ID] User Error:', userError)
        return student
      }

      return {
        ...student,
        users: user,
      }
    }) || [],
  )
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}

export async function updateStudentCourses(
  studentId: string,
  selections: Array<{
    dayOfWeek: TimeSlotEnum
    startTime: string
    endTime: string
    subject: SubjectNameEnum
    teacherId: string
  }>,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // 1. Récupérer les inscriptions actuelles de l'étudiant
    const { data: currentEnrollments, error: fetchError } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select('id, course_sessions_id')
      .eq('student_id', studentId)

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des inscriptions: ${fetchError.message}`)
    }

    // 2. Identifier les inscriptions à supprimer et à ajouter
    const currentSessionIds = new Set(currentEnrollments?.map((e) => e.course_sessions_id) || [])
    const newSessionIds = new Set<string>()

    // Préparer les nouvelles inscriptions
    const newEnrollments = []

    for (const selection of selections) {
      // Trouver le cours du professeur
      const { data: course, error: courseError } = await supabase
        .schema('education')
        .from('courses')
        .select(`
          id,
          courses_teacher!inner (
            teacher_id
          )
        `)
        .eq('is_active', true)
        .eq('courses_teacher.teacher_id', selection.teacherId)
        .single()

      if (courseError || !course) {
        throw new Error(`Cours non trouvé pour le professeur ${selection.teacherId}`)
      }

      // Trouver la session correspondante
      const { data: session, error: sessionError } = await supabase
        .schema('education')
        .from('courses_sessions')
        .select('id')
        .eq('course_id', course.id)
        .eq('subject', selection.subject)
        .single()

      if (sessionError || !session) {
        throw new Error(`Session non trouvée pour ${selection.subject}`)
      }

      newSessionIds.add(session.id)
      newEnrollments.push({
        course_sessions_id: session.id,
        student_id: studentId,
      })
    }

    // 3. Identifier les inscriptions à supprimer
    // (celles qui ne sont plus dans les nouvelles sélections)
    const enrollmentsToDelete = currentEnrollments?.filter(
      (enrollment) => !newSessionIds.has(enrollment.course_sessions_id),
    ) || []

    // 4. Identifier les inscriptions à ajouter (nouvelles sélections qui n'existent pas déjà)
    const enrollmentsToAdd = newEnrollments.filter(
      (enrollment) => !currentSessionIds.has(enrollment.course_sessions_id),
    )

    // 5. Effectuer les opérations de mise à jour
    // Supprimer les inscriptions obsolètes
    if (enrollmentsToDelete.length > 0) {
      const { error: deleteError } = await supabase
        .schema('education')
        .from('courses_sessions_students')
        .delete()
        .in('id', enrollmentsToDelete.map((e) => e.id))

      if (deleteError) {
        throw new Error(`Erreur lors de la suppression: ${deleteError.message}`)
      }
    }

    // Ajouter les nouvelles inscriptions
    if (enrollmentsToAdd.length > 0) {
      const { error: insertError } = await supabase
        .schema('education')
        .from('courses_sessions_students')
        .insert(enrollmentsToAdd)

      if (insertError) {
        throw new Error(`Erreur lors de l'ajout: ${insertError.message}`)
      }
    }

    return {
      success: true,
      message: 'Cours de l\'étudiant mis à jour avec succès',
      data: null,
    }
  } catch (error: any) {
    console.error('[UPDATE_STUDENT_COURSES]', error)
    throw new Error('Failed to update student courses')
  }
}

export async function getAllCoursesWithStats(): Promise<ApiResponse<CourseWithRelations[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Récupérer d'abord les cours avec leurs relations de base
    const { data: courses, error } = await supabase
      .schema('education')
      .from('courses')
      .select(`
        *,
        courses_teacher (
          *,
          users:teacher_id (
            id,
            firstname,
            lastname,
            email,
            subjects,
            date_of_birth,
            gender
          )
        ),
        courses_sessions (
          *,
          courses_sessions_timeslot (
            day_of_week,
            start_time,
            end_time,
            classroom_number
          )
        )
      `)
      .eq('is_active', true)
      .order('academic_year', { ascending: false })

    if (error) {
      console.error('[GET_ALL_COURSES_WITH_STATS]', error)
      return {
        success: false,
        message: 'Erreur lors de la récupération des cours',
        data: null,
      }
    }

    // Enrichir avec les données des étudiants pour chaque session
    const enrichedCourses = await Promise.all(
      (courses || []).map(async (course) => {
        const enrichedSessions = await Promise.all(
          (course.courses_sessions || []).map(async (session: any) => {
            // Récupérer les étudiants de cette session
            const { data: enrollments, error: enrollmentError } = await supabase
              .schema('education')
              .from('courses_sessions_students')
              .select('*')
              .eq('course_sessions_id', session.id)

            if (enrollmentError) {
              console.error('Erreur lors de la récupération des inscriptions:', enrollmentError)
              return { ...session, courses_sessions_students: [] }
            }

            // Récupérer les données des étudiants
            const studentIds = enrollments
              ?.map((e) => e.student_id)
              .filter((id) => id !== null) || []

            const { data: students, error: studentsError } = await supabase
              .schema('education')
              .from('users')
              .select('id, firstname, lastname, email, date_of_birth, gender')
              .in('id', studentIds)

            if (studentsError) {
              console.error('Erreur lors de la récupération des étudiants:', studentsError)
              return { ...session, courses_sessions_students: [] }
            }

            // Associer les étudiants à leurs inscriptions
            const enrichedEnrollments = enrollments?.map((enrollment) => {
              const student = students?.find((s) => s.id === enrollment.student_id)
              return {
                ...enrollment,
                users: student || null,
              }
            }) || []

            return {
              ...session,
              courses_sessions_students: enrichedEnrollments,
            }
          }),
        )

        return {
          ...course,
          courses_sessions: enrichedSessions,
        }
      }),
    )

    return {
      success: true,
      data: enrichedCourses,
      message: 'Cours avec statistiques récupérés avec succès',
    }
  } catch (error: any) {
    console.error('[GET_ALL_COURSES_WITH_STATS]', error)
    throw new Error('Failed to get all courses with stats')
  }
}

type CourseTimeRange = {
  course_id: string
  academic_year: string
  day_of_week: string
  min_start_time: string
  max_end_time: string
  subjects: Array<{
    subject: string
    level: string
    start_time: string
    end_time: string
  }>
}

export async function getCoursesTimeRange(): Promise<
  ApiResponse<CourseTimeRange[]>
  > {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data, error } = await supabase
      .schema('education')
      .from('courses')
      .select(`
        id,
        academic_year,
        courses_sessions (
          id,
          subject,
          level,
          courses_sessions_timeslot (
            day_of_week,
            start_time,
            end_time
          )
        )
      `)
      .eq('is_active', true)
      .order('academic_year', { ascending: false })

    if (error) {
      console.error('[GET_COURSES_TIME_RANGE]', error)
      return {
        success: false,
        message: 'Erreur lors de la récupération des plages horaires',
        data: null,
      }
    }

    // Traiter les données pour obtenir les plages horaires par cours et par jour
    const timeRanges = data?.flatMap((course) => {
      const dayGroups = new Map<string, Array<{
        subject: string
        level: string
        start_time: string
        end_time: string
        session_id: string
      }>>()

      // Grouper les sessions par jour
      course.courses_sessions?.forEach((session) => {
        session.courses_sessions_timeslot?.forEach((timeslot) => {
          const day = timeslot.day_of_week
          if (!dayGroups.has(day)) {
            dayGroups.set(day, [])
          }

          // Ajouter la session avec ses informations
          dayGroups.get(day)!.push({
            subject: session.subject,
            level: session.level,
            start_time: timeslot.start_time,
            end_time: timeslot.end_time,
            session_id: session.id,
          })
        })
      })

      // Calculer les plages min/max et organiser les sujets pour chaque jour
      return Array.from(dayGroups.entries()).map(([day_of_week, sessions]) => {
        // Trier les sessions par heure de début pour avoir l'ordre chronologique
        const sortedSessions = sessions.sort((a, b) =>
          a.start_time.localeCompare(b.start_time),
        )

        const min_start_time = sortedSessions.reduce((min, session) =>
          session.start_time < min ? session.start_time : min, sortedSessions[0].start_time,
        )
        const max_end_time = sortedSessions.reduce((max, session) =>
          session.end_time > max ? session.end_time : max, sortedSessions[0].end_time,
        )

        return {
          course_id: course.id,
          academic_year: course.academic_year,
          day_of_week,
          min_start_time,
          max_end_time,
          subjects: sortedSessions.map((session) => ({
            subject: session.subject,
            level: session.level,
            start_time: session.start_time,
            end_time: session.end_time,
          })),
        }
      })
    }) || []

    // Trier par jour de la semaine (ordre alphabétique) puis par cours
    const sortedTimeRanges = timeRanges.sort((a, b) => {
      if (a.day_of_week !== b.day_of_week) {
        return a.day_of_week.localeCompare(b.day_of_week)
      }
      return a.course_id.localeCompare(b.course_id)
    })

    return {
      success: true,
      data: sortedTimeRanges,
      message: 'Plages horaires récupérées avec succès',
    }
  } catch (error: any) {
    console.error('[GET_COURSES_TIME_RANGE]', error)
    throw new Error('Failed to get courses time range')
  }
}
