'use server'

import { getCourseSessionById } from '@/server/actions/api/courses'
import { getStudentAttendance, getStudentGrade } from '@/server/actions/api/stats'
import { getOneTeacher } from '@/server/actions/api/teachers'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { CourseWithRelations } from '@/types/courses'
import { SubjectNameEnum } from '@/types/courses'
import { User } from '@/types/db'
import { StudentAttendanceResponse } from '@/types/stats-payload'
import { UserRoleEnum } from '@/types/user'

// Type correct pour les grades basé sur le retour de calculateStudentGrade
export interface StudentGradesData {
  details: Array<{
    subject: string
    student: string
    grade: number
    sessionId?: string
  }>
  bySubject: {
    [key in SubjectNameEnum]?: {
      grades: number[]
      average?: number
    }
  }
  overallAverage?: number
}

export interface FamilyStudentData {
  student: User & { role: UserRoleEnum.Student }
  attendance: StudentAttendanceResponse | null
  grades: StudentGradesData | null
  course: CourseWithRelations | null
  teacher: (User & { role: UserRoleEnum.Teacher }) | null
}

export interface FamilyDashboardData {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
  selectedStudentData: FamilyStudentData | null
}

export interface FamilyAllStudentsData {
  familyStudents: Array<User & { role: UserRoleEnum.Student }>
  allStudentsData: Record<string, FamilyStudentData>
}

// Fonction pour récupérer les données d'un étudiant spécifique
export async function getStudentDetailedData(
  student: User & { role: UserRoleEnum.Student },
): Promise<FamilyStudentData> {
  const [attendanceResponse, gradesResponse] = await Promise.all([
    getStudentAttendance(student.id),
    getStudentGrade(student.id),
  ])

  let courseData: CourseWithRelations | null = null
  let teacherData: (User & { role: UserRoleEnum.Teacher }) | null = null

  // Récupérer les cours de l'étudiant
  const { supabase } = await getSessionServer()

  // Récupérer les sessions auxquelles l'étudiant est inscrit
  const { data: studentSessions, error: sessionsError } = await supabase
    .schema('education')
    .from('courses_sessions_students')
    .select('course_sessions_id')
    .eq('student_id', student.id)

  if (!sessionsError && studentSessions && studentSessions.length > 0) {
    const sessionId = studentSessions[0].course_sessions_id

    const courseResponse = await getCourseSessionById(sessionId)
    if (courseResponse?.success && courseResponse.data) {
      // Restructurer les données pour correspondre à l'attendu
      const sessionData = courseResponse.data
      courseData = {
        ...sessionData,
        // Créer un tableau courses_sessions avec la session actuelle
        courses_sessions: [{
          ...sessionData,
          courses_sessions_timeslot: sessionData.courses_sessions_timeslot || [],
        }],
      } as CourseWithRelations

      // Récupérer les données du professeur
      if (sessionData.courses?.id) {
        // Récupérer le professeur via la relation courses_teacher
        const { data: teacherRelation, error: teacherRelationError } = await supabase
          .schema('education')
          .from('courses_teacher')
          .select('teacher_id')
          .eq('course_id', sessionData.courses.id)
          .limit(1)

        if (!teacherRelationError && teacherRelation && teacherRelation.length > 0) {
          const teacherId = teacherRelation[0].teacher_id

          const teacherResponse = await getOneTeacher(teacherId)

          if (teacherResponse?.success && teacherResponse.data) {
            teacherData = {
              ...teacherResponse.data,
              role: UserRoleEnum.Teacher,
              auth_id_email: null,
              auth_id_gmail: null,
              parent2_auth_id_email: null,
              parent2_auth_id_gmail: null,
              secondary_email: null,
              is_active: true,
              deleted_at: null,
              date_of_birth: null,
              gender: null,
              type: null,
              subjects: null,
              school_year: null,
              stats_model: null,
              student_stats_id: null,
              teacher_stats_id: null,
              phone: null,
              secondary_phone: null,
              whatsapp_phone: null,
              created_at: null,
              updated_at: null,
              has_invalid_email: false,
            }
          }
        }
      }
    }
  }

  const result = {
    student,
    attendance: attendanceResponse?.success ? attendanceResponse.data : null,
    grades: gradesResponse?.success ? gradesResponse.data : null,
    course: courseData,
    teacher: teacherData,
  }

  return result
}

export async function getFamilyDashboardData(
  supabaseUserId: string,
  selectedStudentId?: string,
): Promise<ApiResponse<FamilyDashboardData>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Récupérer l'utilisateur principal pour obtenir son email
    const { data: mainUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('email')
      .or(
        `auth_id_email.eq.${supabaseUserId},auth_id_gmail.eq.${supabaseUserId},` +
        `parent2_auth_id_email.eq.${supabaseUserId},parent2_auth_id_gmail.eq.${supabaseUserId}`,
      )
      .eq('is_active', true)
      .eq('role', 'student')
      .limit(1)

    if (userError || !mainUser || mainUser.length === 0) {
      return {
        success: false,
        message: 'Utilisateur principal non trouvé',
        data: null,
      }
    }

    const familyEmail = mainUser[0].email

    // Récupérer tous les étudiants de la fratrie
    const { data: familyStudents, error: studentsError } = await supabase
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
        school_year
      `)
      .eq('email', familyEmail)
      .eq('is_active', true)
      .eq('role', 'student')
      .order('firstname', { ascending: true })

    if (studentsError) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la fratrie',
        data: null,
      }
    }

    const studentsWithRole = (familyStudents || []).map((student) => ({
      ...student,
      role: UserRoleEnum.Student,
    } as User & { role: UserRoleEnum.Student }))

    // Si un étudiant est sélectionné, récupérer ses données détaillées
    let selectedStudentData: FamilyStudentData | null = null

    if (selectedStudentId) {
      const selectedStudent = studentsWithRole.find((s) => s.id === selectedStudentId)

      if (selectedStudent) {
        selectedStudentData = await getStudentDetailedData(selectedStudent)
      }
    }

    return {
      success: true,
      data: {
        familyStudents: studentsWithRole,
        selectedStudentData,
      },
      message: 'Données familiales récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_FAMILY_DASHBOARD_DATA]', error)
    throw new Error('Erreur lors de la récupération des données familiales')
  }
}

// Fonction optimisée pour récupérer les données de tous les enfants en parallèle
export async function getFamilyAllStudentsData(
  supabaseUserId: string,
): Promise<ApiResponse<FamilyAllStudentsData>> {
  await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  try {
    // Récupérer l'utilisateur principal pour obtenir son email
    const { data: mainUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('email')
      .or(
        `auth_id_email.eq.${supabaseUserId},auth_id_gmail.eq.${supabaseUserId},` +
        `parent2_auth_id_email.eq.${supabaseUserId},parent2_auth_id_gmail.eq.${supabaseUserId}`,
      )
      .eq('is_active', true)
      .eq('role', 'student')
      .limit(1)

    if (userError || !mainUser || mainUser.length === 0) {
      return {
        success: false,
        message: 'Utilisateur principal non trouvé',
        data: null,
      }
    }

    const familyEmail = mainUser[0].email

    // Récupérer tous les étudiants de la fratrie
    const { data: familyStudents, error: studentsError } = await supabase
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
        school_year
      `)
      .eq('email', familyEmail)
      .eq('is_active', true)
      .eq('role', 'student')
      .order('firstname', { ascending: true })

    if (studentsError) {
      return {
        success: false,
        message: 'Erreur lors de la récupération de la fratrie',
        data: null,
      }
    }

    const studentsWithRole = (familyStudents || []).map((student) => ({
      ...student,
      role: UserRoleEnum.Student,
    } as User & { role: UserRoleEnum.Student }))

    // Récupérer les données de tous les étudiants en parallèle
    const allStudentsDataPromises = studentsWithRole.map(async (student) => {
      const data = await getStudentDetailedData(student)
      return [student.id, data] as [string, FamilyStudentData]
    })

    const allStudentsDataEntries = await Promise.all(allStudentsDataPromises)
    const allStudentsData = Object.fromEntries(allStudentsDataEntries)

    return {
      success: true,
      data: {
        familyStudents: studentsWithRole,
        allStudentsData,
      },
      message: 'Données familiales récupérées avec succès',
    }
  } catch (error) {
    console.error('[GET_FAMILY_ALL_STUDENTS_DATA]', error)
    throw new Error('Erreur lors de la récupération des données familiales')
  }
}
