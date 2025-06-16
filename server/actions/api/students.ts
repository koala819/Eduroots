'use server'

import { getSessionServer } from '@/server/utils/server-helpers'
import { revalidatePath } from 'next/cache'
import { ApiResponse } from '@/types/api'
import {
  CreateStudentPayload,
  UpdateStudentPayload,
  StudentResponse,
  StudentWithTeachersResponse,
} from '@/types/student-payload'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

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
        password: studentData.password,
        role: 'student',
        type: studentData.type,
        is_active: true,
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

    revalidatePath('/students')
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

    revalidatePath('/students')
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
      .select('id, email, firstname, lastname, type, subjects, created_at, updated_at')
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
      .select('id, email, firstname, lastname, type, subjects, created_at, updated_at')
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
      .select('id, email, firstname, lastname, type, subjects, created_at, updated_at')
      .single()

    if (error || !updatedUser) {
      return {
        success: false,
        message: 'Etudiant non trouvé',
        data: null,
      }
    }

    revalidatePath('/students')
    revalidatePath(`/students/${studentId}`)

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
  const baseFields = ['email', 'firstname', 'lastname', 'password']
  const requiredFields = type === 'teacher' ? [...baseFields, 'subjects'] : [...baseFields, 'type']

  const missingFields = requiredFields.filter((field) => !data[field])

  return missingFields.length > 0
    ? {
      isValid: false,
      message: `Champs manquants: ${missingFields.join(', ')}`,
    }
    : { isValid: true }
}
