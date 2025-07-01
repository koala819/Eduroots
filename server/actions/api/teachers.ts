'use server'

import { revalidatePath } from 'next/cache'

import { sortTimeSlots } from '@/client/utils/timeSlots'
import { getTeacherCourses } from '@/server/actions/api/courses'
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

// Nouvelle fonction pour récupérer les professeurs avec leurs stats
export async function getAllTeachersWithStats(): Promise<
  ApiResponse<
    (TeacherResponse & {
      stats: { totalStudents: number; totalBoys: number; totalGirls: number }
    })[]
  >
  > {
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
      console.error('[GET_ALL_TEACHERS_WITH_STATS] Supabase error:', error)
      return {
        success: false,
        message: 'Professeurs non trouvés',
        data: null,
      }
    }

    // Filtrer les enseignants qui ont un ID valide
    const validTeachers = users?.filter(
      (teacher) => teacher.id && typeof teacher.id === 'string') || []

    // Calculer les stats pour chaque professeur
    const teachersWithStats = await Promise.all(
      validTeachers.map(async (teacher) => {
        // Vérifier que l'ID du professeur est valide avant d'appeler getTeacherCourses
        if (!teacher.id) {
          console.warn('[GET_ALL_TEACHERS_WITH_STATS] Professeur sans ID valide:', teacher)
          return {
            ...teacher,
            stats: {
              totalStudents: 0,
              totalBoys: 0,
              totalGirls: 0,
            },
          }
        }

        try {
          // Récupérer les cours du professeur
          const coursesResponse = await getTeacherCourses(teacher.id)

          let totalStudents = 0
          let totalBoys = 0
          let totalGirls = 0

          if (coursesResponse.success && coursesResponse.data) {
            const uniqueStudents = new Set<string>()
            const studentGenders = new Map<string, string>()

            coursesResponse.data.forEach((course) => {
              course.courses_sessions.forEach((session: any) => {
                session.courses_sessions_students?.forEach((student: any) => {
                  // Vérifier que student.users existe avant d'accéder à ses propriétés
                  if (student.users && student.users.id) {
                    uniqueStudents.add(student.users.id)
                    studentGenders.set(student.users.id, student.users.gender || 'undefined')
                  }
                })
              })
            })

            totalStudents = uniqueStudents.size

            // Compter par genre
            studentGenders.forEach((gender) => {
              if (gender === 'masculin') {
                totalBoys++
              } else if (gender === 'feminin') {
                totalGirls++
              }
            })
          }

          return {
            ...teacher,
            stats: {
              totalStudents,
              totalBoys,
              totalGirls,
            },
          }
        } catch (teacherError) {
          console.error(`[GET_ALL_TEACHERS_WITH_STATS] Erreur pour le professeur
            ${teacher.id}:`, teacherError)
          // Retourner des stats par défaut en cas d'erreur pour ce professeur
          return {
            ...teacher,
            stats: {
              totalStudents: 0,
              totalBoys: 0,
              totalGirls: 0,
            },
          }
        }
      }),
    )

    return {
      success: true,
      data: teachersWithStats,
      message: 'Tous les Professeurs avec statistiques récupérés avec succès',
    }
  } catch (error) {
    console.error('[GET_ALL_TEACHERS_WITH_STATS]', error)
    throw new Error('Erreur lors de la récupération des professeurs avec statistiques')
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
      .select('id, email, firstname, lastname, subjects, created_at, updated_at, type, is_active')
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

    // Récupérer les cours du professeur
    const { data: courseTeachers, error: courseTeachersError } = await supabase
      .schema('education')
      .from('courses_teacher')
      .select('course_id')
      .eq('teacher_id', teacherId)
      .eq('is_active', true)

    if (courseTeachersError) {
      console.error('[GET_STUDENTS_BY_TEACHER] Course teachers error:', courseTeachersError)
      throw new Error('Erreur lors de la récupération des cours du professeur')
    }

    const courseIds = courseTeachers?.map((ct) => ct.course_id) || []

    if (courseIds.length === 0) {
      return {
        success: true,
        data: {
          ...teacher,
          courses: [],
          type: 'teacher',
        },
        message: 'Aucun cours trouvé pour ce professeur',
      }
    }

    // Récupérer les détails des cours
    const { data: courses, error: coursesError } = await supabase
      .schema('education')
      .from('courses')
      .select('id, academic_year')
      .in('id', courseIds)
      .eq('is_active', true)

    if (coursesError) {
      console.error('[GET_STUDENTS_BY_TEACHER] Courses error:', coursesError)
      throw new Error('Erreur lors de la récupération des cours')
    }

    // Pour chaque cours, récupérer les sessions et étudiants
    const coursesWithStudents = await Promise.all(
      courses?.map(async (course) => {
        // Récupérer les sessions du cours
        const { data: sessions, error: sessionsError } = await supabase
          .schema('education')
          .from('courses_sessions')
          .select('id, subject, level')
          .eq('course_id', course.id)
          .eq('is_active', true)

        if (sessionsError) {
          console.error('[GET_STUDENTS_BY_TEACHER] Sessions error:', sessionsError)
          return {
            courseId: course.id,
            academicYear: course.academic_year.toString(),
            sessions: [],
          }
        }

        // Pour chaque session, récupérer les créneaux et étudiants
        const sessionsWithStudents = await Promise.all(
          sessions?.map(async (session) => {
            // Récupérer les créneaux horaires
            const { data: timeslots } = await supabase
              .schema('education')
              .from('courses_sessions_timeslot')
              .select('day_of_week, start_time, end_time')
              .eq('course_sessions_id', session.id)

            // Récupérer les étudiants
            const { data: sessionStudents } = await supabase
              .schema('education')
              .from('courses_sessions_students')
              .select('student_id')
              .eq('course_sessions_id', session.id)

            // Récupérer les informations des étudiants
            const studentsWithDetails = await Promise.all(
              sessionStudents?.map(async (studentRelation) => {
                const { data: user } = await supabase
                  .schema('education')
                  .from('users')
                  .select('id, firstname, lastname, email, secondary_email, gender, date_of_birth')
                  .eq('id', studentRelation.student_id)
                  .single()

                return user ? {
                  id: user.id,
                  firstname: user.firstname,
                  lastname: user.lastname,
                  email: user.email,
                  secondaryEmail: user.secondary_email,
                  gender: user.gender,
                  dateOfBirth: user.date_of_birth,
                } : null
              }) || [],
            )

            return {
              sessionId: session.id,
              subject: session.subject,
              level: session.level,
              timeSlot: timeslots?.[0]?.day_of_week || '',
              startTime: timeslots?.[0]?.start_time || '',
              endTime: timeslots?.[0]?.end_time || '',
              students: studentsWithDetails.filter((student) => student !== null),
            }
          }) || [],
        )

        // Trier les sessions selon le créneau horaire
        const sortedSessions = sessionsWithStudents.sort(sortTimeSlots)

        return {
          courseId: course.id,
          academicYear: course.academic_year.toString(),
          sessions: sortedSessions,
        }
      }),
    )

    return {
      success: true,
      data: {
        ...teacher,
        courses: coursesWithStudents,
        type: 'teacher',
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
