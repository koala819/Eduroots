'use server'

import { createClient } from '@/utils/supabase/server'

import { ApiResponse } from '@/types/supabase/api'
import { Student } from '@/types/mongo/user'
import { SerializedValue, serializeData } from '@/lib/serialization'

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error) {
    throw new Error('Erreur d\'authentification')
  }

  if (!user) {
    throw new Error('Utilisateur non authentifié')
  }

  if (user.app_metadata?.provider === 'anonymous') {
    throw new Error('Accès refusé aux utilisateurs anonymes')
  }

  return { user }
}

export async function createStudent(
  studentData: Omit<Student, 'id' | '_id' | 'createdAt' | 'updatedAt'>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

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
        type: (studentData as any).type,
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

    return {
      success: true,
      data: serializeData({ id: newUser.id }),
      message: 'Etudiant créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_STUDENT]', error)
    throw new Error('Erreur lors de la création de l\'étudiant')
  }
}

export async function deleteStudent(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

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

export async function getAllStudents(): Promise<ApiResponse<SerializedValue>> {
  const supabase = await createClient()

  try {
    const { data: users, error } = await supabase
      .schema('education')
      .from('users')
      .select('*')
      .eq('role', 'student')
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
      data: serializeData(users),
      message: 'Tous les Etudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_STUDENTS]', error)
    throw new Error('Erreur lors de la récupération des étudiants')
  }
}

export async function getOneStudent(studentId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

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
      data: serializeData(user),
      message: 'Etudiant récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_STUDENT]', error)
    throw new Error('Erreur lors de la récupération de l\'étudiant')
  }
}

export async function getTeachersForStudent(
  studentId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

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

    return {
      success: true,
      data: serializeData(teachers),
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
  studentData: Partial<Student>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  const supabase = await createClient()

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

    return {
      success: true,
      data: serializeData(updatedUser),
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
