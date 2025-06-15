'use server'

import { createClient } from '@/utils/supabase/server'
import { Database } from '@/types/supabase/db'
import { ApiResponse } from '@/types/supabase/api'
import { SerializedValue, serializeData } from '@/lib/serialization'

type Teacher = Database['public']['Tables']['users']['Row'] & {
  role: 'teacher'
}

type TeacherInsert = Database['public']['Tables']['users']['Insert'] & {
  role: 'teacher'
}

type TeacherUpdate = Database['public']['Tables']['users']['Update']

async function getSessionServer() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    throw new Error('Non authentifié')
  }

  return { user }
}

export async function createTeacher(
  teacherData: Omit<TeacherInsert, 'id' | 'created_at' | 'updated_at'>,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const validation = validateRequiredFields('teacher', teacherData)

    if (!validation.isValid) {
      return {
        success: false,
        message: validation.message as string,
        data: null,
      }
    }

    const supabase = await createClient()

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

    return {
      success: true,
      data: serializeData({ id: newUser.id }),
      message: 'Professeur créé avec succès',
    }
  } catch (error) {
    console.error('[CREATE_TEACHER]', error)
    throw new Error('Erreur lors de la création du professeur')
  }
}

export async function deleteTeacher(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!teacherId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const supabase = await createClient()

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

export async function getAllTeachers(): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    const supabase = await createClient()

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
      data: users ? serializeData(users) : null,
      message: 'Tous les Professeurs récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_TEACHERS]', error)
    throw new Error('Erreur lors de la récupération des professeurs')
  }
}

export async function getOneTeacher(teacherId: string): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!teacherId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const supabase = await createClient()

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
      data: user ? serializeData(user) : null,
      message: 'Professeur récupéré avec succès',
    }
  } catch (error) {
    console.error('[GET_ONE_TEACHER]', error)
    throw new Error('Erreur lors de la récupération du professeur')
  }
}

export async function getStudentsByTeacher(
  teacherId: string,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()

  try {
    const supabase = await createClient()

    // Vérifier que le professeur existe
    const { data: teacher, error: teacherError } = await supabase
      .schema('education')
      .from('users')
      .select('id')
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

    // Transformer les données pour correspondre à l'ancienne structure
    const coursesWithStudents = courses?.map((course) => {
      const sessionsWithStudents = course.courses_sessions?.map((session) => {
        const students = session.courses_sessions_students?.map((studentRelation: any) => {
          const user = studentRelation.users
          return {
            _id: user?.id,
            id: user?.id,
            firstname: user?.firstname,
            lastname: user?.lastname,
            email: user?.email,
            secondaryEmail: user?.secondary_email,
            gender: user?.gender,
            dateOfBirth: user?.date_of_birth,
          }
        }) || []

        return {
          sessionId: session.id,
          subject: session.subject,
          level: session.level,
          timeSlot: session.time_slot,
          students,
        }
      }) || []

      return {
        courseId: course.id,
        academicYear: course.academic_year,
        sessions: sessionsWithStudents,
      }
    }) || []

    return {
      success: true,
      data: coursesWithStudents ? serializeData(coursesWithStudents) : null,
      message: 'Cours et leurs étudiants récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_STUDENTS_BY_TEACHER]', error)
    throw new Error('Erreur lors de la récupération des étudiants du professeur')
  }
}

export async function updateTeacher(
  teacherId: string,
  teacherData: TeacherUpdate,
): Promise<ApiResponse<SerializedValue>> {
  await getSessionServer()
  try {
    if (!teacherId) {
      return {
        success: false,
        message: 'Id invalide',
        data: null,
      }
    }

    const supabase = await createClient()

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

    return {
      success: true,
      data: updatedUser ? serializeData(updatedUser) : null,
      message: 'Professeur mis à jour avec succès',
    }
  } catch (error) {
    console.error('[UPDATE_TEACHER]', error)
    throw new Error('Erreur lors de la mise à jour du professeur')
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
