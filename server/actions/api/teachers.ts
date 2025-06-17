'use server'

import { revalidatePath } from 'next/cache'

import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import {
  CreateTeacherPayload,
  TeacherResponse,
  TeacherWithStudentsResponse,
  UpdateTeacherPayload,
} from '@/types/teacher-payload'

export async function createTeacher(
  teacherData: CreateTeacherPayload,
): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const validation = validateRequiredFields('teacher', teacherData)

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
      .insert([{ ...teacherData, role: 'teacher' }])
      .select()
      .single()

    if (error || !newUser) {
      console.error('[CREATE_TEACHER] Supabase error:', error)
      return {
        success: false,
        message: 'Professeur non créé',
        data: null,
      }
    }

    revalidatePath('/teachers')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: { id: newUser.id },
      message: 'Professeur créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_TEACHER]', error)
    throw new Error('Erreur lors de la création du professeur')
  }
}

export async function deleteTeacher(teacherId: string): Promise<ApiResponse> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!teacherId) {
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
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('is_active', true)
      .select()
      .single()

    if (error || !deletedUser) {
      console.error('[DELETE_TEACHER] Supabase error:', error)
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    revalidatePath('/teachers')
    revalidatePath('/dashboard')

    return {
      success: true,
      data: null,
      message: 'Professeur supprimé avec succès',
    }
  } catch (error) {
    console.error('[DELETE_TEACHER]', error)
    throw new Error('Erreur lors de la suppression du professeur')
  }
}

export async function getAllTeachers(): Promise<ApiResponse<TeacherResponse[]>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    const { data: users, error } = await supabase
      .schema('education')
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'teacher')
      .order('firstname', { ascending: true })
      .order('lastname', { ascending: true })

    if (error) {
      console.error('[GET_ALL_TEACHERS] Supabase error:', error)
      return {
        success: false,
        message: 'Professeurs non trouvés',
        data: null,
      }
    }

    return {
      success: true,
      data: users,
      message: 'Tous les Professeurs récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_TEACHERS]', error)
    throw new Error('Erreur lors de la récupération des professeurs')
  }
}

export async function getOneTeacher(teacherId: string): Promise<ApiResponse<TeacherResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!teacherId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const { data: user, error } = await supabase
      .schema('education')
      .from('users')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'teacher')
      .eq('id', teacherId)
      .single()

    if (error || !user) {
      console.error('[GET_ONE_TEACHER] Supabase error:', error)
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    return {
      success: true,
      data: user,
      message: 'Professeur récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_TEACHER]', error)
    throw new Error('Erreur lors de la récupération du professeur')
  }
}

export async function getStudentsByTeacher(
  teacherId: string,
): Promise<ApiResponse<TeacherWithStudentsResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Vérifier que le professeur existe
    const { data: teacher, error: teacherError } = await supabase
      .schema('education')
      .from('users')
      .select('id, email, firstname, lastname, subjects, created_at, updated_at')
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('is_active', true)
      .single()

    if (teacherError || !teacher) {
      console.error('[GET_STUDENTS_BY_TEACHER] Teacher not found:', teacherError)
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    // Récupérer les cours avec leurs sessions et étudiants
    const { data: courses, error: coursesError } = await supabase
      .schema('education')
      .from('courses')
      .select(`
        id,
        academic_year,
        courses_sessions (
          id,
          subject,
          level,
          time_slot,
          courses_sessions_students (
            users (
              id,
              email,
              secondary_email,
              firstname,
              lastname,
              date_of_birth,
              gender
            )
          )
        )
      `)
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (coursesError) {
      console.error('[GET_STUDENTS_BY_TEACHER] Courses error:', coursesError)
      throw new Error('Erreur lors de la récupération des cours')
    }

    // Transformer les données pour correspondre à la structure attendue
    const coursesWithStudents = courses?.map((course) => ({
      courseId: course.id,
      academicYear: course.academic_year,
      sessions: course.courses_sessions?.map((session) => ({
        sessionId: session.id,
        subject: session.subject,
        level: session.level,
        timeSlot: session.time_slot,
        students: session.courses_sessions_students?.map((studentRelation: any) => ({
          id: studentRelation.users.id,
          firstname: studentRelation.users.firstname,
          lastname: studentRelation.users.lastname,
          email: studentRelation.users.email,
          secondaryEmail: studentRelation.users.secondary_email,
          gender: studentRelation.users.gender,
          dateOfBirth: studentRelation.users.date_of_birth,
        })) || [],
      })) || [],
    })) || []

    return {
      success: true,
      data: {
        ...teacher,
        courses: coursesWithStudents,
      },
      message: 'Cours et leurs étudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_STUDENTS_BY_TEACHER]', error)
    throw new Error('Erreur lors de la récupération des étudiants du professeur')
  }
}

export async function updateTeacher(
  teacherId: string,
  teacherData: UpdateTeacherPayload,
): Promise<ApiResponse<TeacherResponse>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    if (!teacherId) {
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
        ...teacherData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', teacherId)
      .eq('role', 'teacher')
      .eq('is_active', true)
      .select()
      .single()

    if (error || !updatedUser) {
      console.error('[UPDATE_TEACHER] Supabase error:', error)
      return {
        success: false,
        message: 'Professeur non trouvé',
        data: null,
      }
    }

    revalidatePath('/teachers')
    revalidatePath(`/teachers/${teacherId}`)

    return {
      success: true,
      data: updatedUser,
      message: 'Professeur mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER]', error)
    throw new Error('Erreur lors de la mise à jour du professeur')
  }
}

function validateRequiredFields(
  type: string,
  data: any,
): { isValid: boolean; message?: string } {
  const baseFields = ['email', 'firstname', 'lastname']
  const requiredFields =
    type === 'teacher' ? [...baseFields, 'subjects'] : [...baseFields, 'type']

  const missingFields = requiredFields.filter((field) => !data[field])

  return missingFields.length > 0
    ? {
      isValid: false,
      message: `Champs manquants: ${missingFields.join(', ')}`,
    }
    : { isValid: true }
}
