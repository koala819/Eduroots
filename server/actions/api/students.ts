'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import {
  CreateStudentPayload,
  StudentResponse,
  StudentWithTeachersResponse,
  UpdateStudentPayload,
} from '@/types/student-payload'

export async function createStudent(
  studentData: CreateStudentPayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const validation = validateRequiredFields('student', studentData)

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message as string,
        data: null,
      }
    }

    const { data: newUser, error } = await supabase
      .schema('education')
      .from('users')
      .insert({
        email: studentData.email,
        firstname: studentData.firstname,
        lastname: studentData.lastname,
        role: studentData.role,
        type: studentData.type,
        gender: studentData.gender,
        secondary_email: studentData.secondary_email,
        phone: studentData.phone,
        secondary_phone: studentData.secondary_phone,
        whatsapp_phone: studentData.whatsapp_phone,
        school_year: studentData.school_year,
        subjects: studentData.subjects,
        has_invalid_email: studentData.has_invalid_email,
        date_of_birth: studentData.date_of_birth,
        is_active: true,
        deleted_at: studentData.deleted_at,
        stats_model: studentData.stats_model,
        student_stats_id: studentData.student_stats_id,
        teacher_stats_id: studentData.teacher_stats_id,
        // Champs d'authentification à NULL pour éviter les contraintes
        auth_id_email: null,
        auth_id_gmail: null,
        parent2_auth_id_email: null,
        parent2_auth_id_gmail: null,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error || !newUser) {
      return {
        success: false,
        message: 'Etudiant non créé',
        data: null,
      }
    }

    revalidatePath('/family')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { id: newUser.id },
      message: 'Etudiant créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_STUDENT]', error)
    throw new Error('Erreur lors de la création de l\'étudiant')
  }
}

export async function deleteStudent(studentId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!studentId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const { data: deletedUser, error } = await supabase
      .schema('education')
      .from('users')
      .update({
        is_active: false,
        deleted_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .eq('role', 'student')
      .eq('is_active', true)
      .select('id, firstname, lastname, email')
      .single()

    if (error || !deletedUser) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    revalidatePath('/family')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: null,
      message: 'Etudiant supprimé avec succès',
    }
  } catch (error) {
    console.error('[DELETE_STUDENT]', error)
    throw new Error('Erreur lors de la suppression de l\'étudiant')
  }
}

export async function getAllStudents(): Promise<ApiResponse<StudentResponse[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: users, error } = await supabase
      .schema('education')
      .from('users')
      .select('*')
      .eq('role', 'student')
      .eq('is_active', true)
      .order('firstname', { ascending: true })
      .order('lastname', { ascending: true })

    if (error) {
      console.error('❌ Erreur Supabase:', error)
      throw new Error(`Erreur lors de la récupération: ${error.message}`)
    }

    if (!users || users.length === 0) {
      return {
        success: false,
        message: 'Etudiants non trouvés',
        data: null,
      }
    }

    return {
      success: true,
      data: users,
      message: 'Tous les Etudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_STUDENTS]', error)
    throw new Error('Erreur lors de la récupération des étudiants')
  }
}

export async function getOneStudent(studentId: string): Promise<ApiResponse<StudentResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!studentId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const { data: user, error } = await supabase
      .schema('education')
      .from('users')
      .select(`
        id,
        email,
        firstname,
        lastname,
        type,
        subjects,
        created_at,
        updated_at,
        gender,
        date_of_birth,
        secondary_email,
        phone,
        secondary_phone,
        whatsapp_phone,
        school_year,
        is_active
      `)
      .eq('is_active', true)
      .eq('role', 'student')
      .eq('id', studentId)
      .single()

    if (error || !user) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: user,
      message: 'Etudiant récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_STUDENT]', error)
    throw new Error('Erreur lors de la récupération de l\'étudiant')
  }
}

export async function getTeachersForStudent(
  studentId: string,
): Promise<ApiResponse<StudentWithTeachersResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!studentId) {
      return {
        success: false,
        message: 'Id étudiant manquant',
        data: null,
      }
    }

    // Récupérer les cours de l'étudiant
    const { data: enrollments, error: enrollmentError } = await supabase
      .schema('education')
      .from('courses_sessions_students')
      .select(`
        courses_sessions (
          courses (
            courses_teacher (
              users:teacher_id (
                id,
                email,
                firstname,
                lastname,
                subjects
              )
            )
          )
        )
      `)
      .eq('student_id', studentId)

    if (enrollmentError) {
      throw new Error(`Erreur lors de la récupération des cours: ${enrollmentError.message}`)
    }

    if (!enrollments || enrollments.length === 0) {
      return {
        success: false,
        message: 'Aucun cours trouvé pour cet étudiant',
        data: null,
      }
    }

    // Extraire les professeurs uniques
    const teachersMap = new Map()
    enrollments.forEach((enrollment: any) => {
      const session = enrollment.courses_sessions
      if (session?.courses?.courses_teacher) {
        session.courses.courses_teacher.forEach((teacherLink: any) => {
          const teacher = teacherLink.users
          if (teacher) {
            teachersMap.set(teacher.id, teacher)
          }
        })
      }
    })

    const teachers = Array.from(teachersMap.values())

    if (teachers.length === 0) {
      return {
        success: false,
        message: 'Aucun professeur trouvé',
        data: null,
      }
    }

    // Récupérer les informations de l'étudiant
    const { data: student, error: studentError } = await supabase
      .schema('education')
      .from('users')
      .select(`
        id,
        email,
        firstname,
        lastname,
        type,
        subjects,
        created_at,
        updated_at,
        gender,
        date_of_birth,
        secondary_email,
        phone,
        secondary_phone,
        whatsapp_phone,
        school_year,
        is_active
      `)
      .eq('id', studentId)
      .single()

    if (studentError || !student) {
      throw new Error('Erreur lors de la récupération des informations de l\'étudiant')
    }

    return {
      success: true,
      data: {
        ...student,
        teachers,
      },
      message: 'Professeurs récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_TEACHERS_FOR_STUDENT]', error)
    return {
      success: false,
      message: 'Erreur lors de la récupération des professeurs',
      data: null,
    }
  }
}

export async function updateStudent(
  studentId: string,
  studentData: UpdateStudentPayload,
): Promise<ApiResponse<StudentResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!studentId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const { data: updatedUser, error } = await supabase
      .schema('education')
      .from('users')
      .update({
        ...studentData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .eq('role', 'student')
      .eq('is_active', true)
      .select(`
        id,
        email,
        firstname,
        lastname,
        type,
        subjects,
        created_at,
        updated_at,
        gender,
        date_of_birth,
        secondary_email,
        phone,
        secondary_phone,
        whatsapp_phone,
        school_year,
        is_active
      `)
      .single()

    if (error || !updatedUser) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    revalidatePath('/family')
    revalidatePath(`/family/${studentId}`)
    revalidatePath('/admin/members')
    revalidatePath(`/admin/members/student/edit/${studentId}`)

    return {
      success: true,
      data: updatedUser,
      message: 'Etudiant mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_STUDENT]', error)
    throw new Error('Erreur lors de la mise à jour de l\'étudiant')
  }
}

function validateRequiredFields(type: string, data: any): {isValid: boolean; message?: string} {
  const baseFields = ['email', 'firstname', 'lastname']
  const requiredFields = type === 'teacher' ? [...baseFields, 'subjects'] : [...baseFields, 'type']

  const missingFields = requiredFields.filter((field) => !data[field])

  return missingFields.length > 0
    ? {
      isValid: false,
      message: `Champs manquants: ${missingFields.join(', ')}`,
    }
    : { isValid: true }
}

export async function createStudentWithCourses(
  studentData: CreateStudentPayload,
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
    // 1. Créer l'étudiant
    const { data: newUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .insert({
        email: studentData.email,
        firstname: studentData.firstname,
        lastname: studentData.lastname,
        role: studentData.role,
        type: studentData.type,
        gender: studentData.gender,
        secondary_email: studentData.secondary_email,
        phone: studentData.phone,
        secondary_phone: studentData.secondary_phone,
        whatsapp_phone: studentData.whatsapp_phone,
        school_year: studentData.school_year,
        subjects: studentData.subjects,
        has_invalid_email: studentData.has_invalid_email,
        date_of_birth: studentData.date_of_birth,
        is_active: studentData.is_active,
        deleted_at: studentData.deleted_at,
        stats_model: studentData.stats_model,
        student_stats_id: studentData.student_stats_id,
        teacher_stats_id: studentData.teacher_stats_id,
        // Champs d'authentification à NULL pour éviter les contraintes
        auth_id_email: null,
        auth_id_gmail: null,
        parent2_auth_id_email: null,
        parent2_auth_id_gmail: null,
      })
      .select()
      .single()

    if (userError || !newUser) {
      console.error('[CREATE_STUDENT_WITH_COURSES] User creation error:', userError)
      return {
        success: false,
        message: 'Étudiant non créé',
        data: null,
      }
    }

    const studentId = newUser.id

    // 2. Inscrire l'étudiant aux cours
    for (const selection of selections) {
      try {
        // Étape 1: Trouver le course_id pour ce professeur
        const { data: teacherCourse, error: teacherError } = await supabase
          .schema('education')
          .from('courses_teacher')
          .select('course_id')
          .eq('teacher_id', selection.teacherId)
          .eq('is_active', true)
          .single()

        if (teacherError || !teacherCourse) {
          console.error('[CREATE_STUDENT_WITH_COURSES] Teacher course error:', teacherError)
          return {
            success: false,
            message: `Cours non trouvé pour le professeur ${selection.teacherId}`,
            data: null,
          }
        }

        // Étape 2: Chercher directement la session avec toutes les conditions
        const { data: sessions, error: sessionError } = await supabase
          .schema('education')
          .from('courses_sessions')
          .select(`
            id,
            courses_sessions_timeslot!inner (
              day_of_week,
              start_time,
              end_time
            )
          `)
          .eq('subject', selection.subject)
          .eq('course_id', teacherCourse.course_id)
          .eq('courses_sessions_timeslot.day_of_week', selection.dayOfWeek)
          .eq('courses_sessions_timeslot.start_time', selection.startTime)
          .eq('courses_sessions_timeslot.end_time', selection.endTime)

        if (sessionError || !sessions || sessions.length === 0) {
          console.error('[CREATE_STUDENT_WITH_COURSES] Session error:', sessionError)
          console.error('[CREATE_STUDENT_WITH_COURSES] Selection:', selection)
          console.error('[CREATE_STUDENT_WITH_COURSES] Teacher course:', teacherCourse)
          return {
            success: false,
            message: `Session non trouvée pour ${selection.subject} avec le professeur
            ${selection.teacherId} au créneau ${selection.dayOfWeek}
            ${selection.startTime}-${selection.endTime}`,
            data: null,
          }
        }

        const session = sessions[0] // Prendre la première session trouvée

        // Étape 3: Vérifier si l'étudiant est déjà inscrit
        const { data: existingEnrollment } = await supabase
          .schema('education')
          .from('courses_sessions_students')
          .select('id')
          .eq('course_sessions_id', session.id)
          .eq('student_id', studentId)
          .single()

        if (existingEnrollment) {
          console.warn(`[CREATE_STUDENT_WITH_COURSES] Student already enrolled in
            session ${session.id}`)
          continue // Passer au cours suivant
        }

        // Étape 4: Inscrire l'étudiant
        const { error: enrollError } = await supabase
          .schema('education')
          .from('courses_sessions_students')
          .insert({
            course_sessions_id: session.id,
            student_id: studentId,
          })

        if (enrollError) {
          console.error(`[CREATE_STUDENT_WITH_COURSES] Enrollment error for
            ${selection.subject}:`, enrollError)
          return {
            success: false,
            message: `Erreur lors de l'inscription au cours
            ${selection.subject}: ${enrollError.message}`,
            data: null,
          }
        }

        console.log(`[CREATE_STUDENT_WITH_COURSES] Successfully enrolled in ${selection.subject}`)
      } catch (error) {
        console.error(`[CREATE_STUDENT_WITH_COURSES] Error processing selection
          ${selection.subject}:`, error)
        return {
          success: false,
          message: `Erreur lors du traitement du cours ${selection.subject}`,
          data: null,
        }
      }
    }

    revalidatePath('/admin/members')
    revalidatePath('/admin/settings')

    return {
      success: true,
      data: { id: studentId },
      message: 'Étudiant créé et inscrit aux cours avec succès',
    }
  } catch (error: any) {
    console.error('[CREATE_STUDENT_WITH_COURSES]', error)
    throw new Error('Erreur lors de la création de l\'étudiant avec ses cours')
  }
}
