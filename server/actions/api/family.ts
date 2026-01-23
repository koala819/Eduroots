'use server'

import { createClient as createServiceClient } from '@supabase/supabase-js'
import { getCourseSessionById } from '@/server/actions/api/courses'
import { getStudentAttendance, getStudentGrade } from '@/server/actions/api/stats'
import { getOneTeacher } from '@/server/actions/api/teachers'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'
import { getSessionServer } from '@/server/utils/server-helpers'
import { ApiResponse } from '@/types/api'
import { CourseWithRelations } from '@/types/courses'
import { SubjectNameEnum } from '@/types/courses'
import { User } from '@/types/db'
import { FamilyProfileSummary, FamilyStudentContact, ParentContact } from '@/types/family-payload'
import { StudentAttendanceResponse } from '@/types/stats-payload'
import { UserRoleEnum } from '@/types/user'
import { getFeesWithNotesByFamilyId } from '@/server/actions/api/fees'

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
              family_id: null,
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
    // Récupérer l'utilisateur principal pour identifier la famille
    const { data: mainUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id, family_id')
      .or(
        `auth_id_email.eq.${supabaseUserId},auth_id_gmail.eq.${supabaseUserId},` +
        `parent2_auth_id_email.eq.${supabaseUserId},parent2_auth_id_gmail.eq.${supabaseUserId}`,
      )
      .eq('is_active', true)
      .limit(1)

    if (userError || !mainUser || mainUser.length === 0) {
      return {
        success: false,
        message: 'Utilisateur principal non trouvé',
        data: null,
      }
    }

    const familyId = mainUser[0].family_id

    if (!familyId) {
      return {
        success: false,
        message: 'Famille non renseignée pour cet utilisateur',
        data: null,
      }
    }

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
      .eq('family_id', familyId)
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

    if (familyStudents.length === 0) {
      return {
        success: false,
        message: 'Aucun étudiant trouvé dans la fratrie',
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
    // Récupérer l'utilisateur principal pour identifier la famille
    const { data: mainUser, error: userError } = await supabase
      .schema('education')
      .from('users')
      .select('id, family_id')
      .or(
        `auth_id_email.eq.${supabaseUserId},auth_id_gmail.eq.${supabaseUserId},` +
        `parent2_auth_id_email.eq.${supabaseUserId},parent2_auth_id_gmail.eq.${supabaseUserId}`,
      )
      .eq('is_active', true)
      .limit(1)

    if (userError || !mainUser || mainUser.length === 0) {
      return {
        success: false,
        message: 'Utilisateur principal non trouvé',
        data: null,
      }
    }

    const familyId = mainUser[0].family_id

    if (!familyId) {
      return {
        success: false,
        message: 'Famille non renseignée pour cet utilisateur',
        data: null,
      }
    }

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
      .eq('family_id', familyId)
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

    if (familyStudents.length === 0) {
      return {
        success: false,
        message: 'Aucun étudiant trouvé dans la fratrie',
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

function buildParentContacts(students: FamilyStudentContact[]): ParentContact[] {
  if (students.length === 0) {
    return [
      { label: 'pere', email: null, phone: null, whatsapp: null },
      { label: 'mere', email: null, phone: null, whatsapp: null },
    ]
  }

  const primary = students.find((student) => student.email || student.phone) ?? students[0]
  const secondary = students.find((student) => student.secondary_email || student.secondary_phone)

  return [
    {
      label: 'pere',
      email: primary?.email ?? null,
      phone: primary?.phone ?? null,
      whatsapp: primary?.whatsapp_phone ?? null,
    },
    {
      label: 'mere',
      email: secondary?.secondary_email ?? null,
      phone: secondary?.secondary_phone ?? null,
      whatsapp: secondary?.whatsapp_phone ?? null,
    },
  ]
}

export async function getFamilyProfileSummaryByStudentId(
  studentId: string,
): Promise<ApiResponse<FamilyProfileSummary>> {
  const authUser = await getAuthenticatedUser()
  const { supabase } = await getSessionServer()

  const isAdminOrBureau = authUser.user_metadata?.role === UserRoleEnum.Admin ||
    authUser.user_metadata?.role === UserRoleEnum.Bureau
  const adminSupabase = isAdminOrBureau
    ? createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
    : null
  const db = adminSupabase ?? supabase
  
  // Vérifier si l'utilisateur est admin dans la table users
  const { data: currentUser, error: currentUserError } = await db
    .schema('education')
    .from('users')
    .select('id, role, auth_id_email, auth_id_gmail, firstname, lastname')
    .or(`auth_id_email.eq.${authUser.id},auth_id_gmail.eq.${authUser.id}`)
    .maybeSingle()
  
  if (currentUserError) {
    console.error(`[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur récupération utilisateur courant:`, currentUserError)
  }

  try {
    if (!studentId) {
      return { success: false, message: 'Id étudiant manquant', data: null }
    }

    // 1. Récupérer l'étudiant et son family_id
    const { data: student, error: studentError } = await db
      .schema('education')
      .from('users')
      .select('id, family_id, firstname, lastname')
      .eq('id', studentId)
      .eq('role', 'student')
      .maybeSingle()

    if (studentError) {
      console.error(`[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur récupération étudiant:`, studentError)
      return { success: false, message: `Étudiant non trouvé: ${studentError.message}`, data: null }
    }

    if (!student) {
      console.error(`[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Étudiant non trouvé: ${studentId}`)
      return { success: false, message: 'Étudiant non trouvé', data: null }
    }

    if (!student.family_id) {
      return {
        success: true,
        message: 'Famille non renseignée',
        data: {
          family: null,
          siblings: [],
          parents: buildParentContacts([]),
          fees: [],
        },
      }
    }

    // 2. Récupérer TOUS les utilisateurs avec le même family_id pour voir la famille
    const { data: familyUsers } = await db
      .schema('education')
      .from('users')
      .select('id, family_id, role, firstname, lastname, is_active')
      .eq('family_id', student.family_id)

    // 3. Récupérer la famille depuis la table families (sans condition is_active)
    let family = null
    const { data: familyData, error: familyError } = await db
      .schema('education')
      .from('families')
      .select('*')
      .eq('id', student.family_id)
      .maybeSingle()

    if (familyError) {
      console.error(`[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur récupération famille:`, familyError)
      console.error(`  - Code: ${familyError.code}, Message: ${familyError.message}`)
    } else {
      family = familyData
    }

    if (!family) {
      // Créer automatiquement la famille manquante basée sur les utilisateurs
      if (familyUsers && familyUsers.length > 0) {
        // Générer un label de famille basé sur le nom de famille le plus commun
        const lastnames = familyUsers.map(u => u.lastname).filter(Boolean)
        const mostCommonLastname = lastnames.length > 0
          ? lastnames.reduce((a, b, _, arr) =>
              arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
            )
          : 'Famille'

        const familyLabel = `Famille ${mostCommonLastname}`

        // Essayer de créer la famille avec l'ID existant (si possible) ou laisser la base générer un nouvel ID
        const { data: newFamily, error: createFamilyError } = await db
          .schema('education')
          .from('families')
          .insert({
            id: student.family_id, // Utiliser l'ID existant du family_id
            label: familyLabel,
            divorced: false,
            is_active: true,
          })
          .select()
          .single()

        if (createFamilyError) {
          // Si l'insertion avec l'ID existant échoue (peut-être à cause d'une contrainte),
          // créer une nouvelle famille et mettre à jour les users
          const { data: newFamily2, error: createFamilyError2 } = await db
            .schema('education')
            .from('families')
            .insert({
              label: familyLabel,
              divorced: false,
              is_active: true,
            })
            .select()
            .single()

          if (!createFamilyError2 && newFamily2) {
            // Mettre à jour tous les users avec le nouveau family_id
            const { error: updateError } = await db
              .schema('education')
              .from('users')
              .update({ family_id: newFamily2.id })
              .eq('family_id', student.family_id)

            // Utiliser directement newFamily2 (pas besoin de requête supplémentaire)
            family = newFamily2
          }
        } else if (newFamily) {
          family = newFamily
        }
      }
    }

    // 4. Récupérer tous les siblings (étudiants actifs avec le même family_id)
    // Note: whatsapp_phone peut ne pas exister dans certaines bases de données
    const { data: siblings, error: siblingsError } = await db
      .schema('education')
      .from('users')
      .select(`
        id,
        firstname,
        lastname,
        email,
        secondary_email,
        phone,
        secondary_phone
      `)
      .eq('family_id', student.family_id)
      .eq('role', 'student')
      .eq('is_active', true)
      .order('firstname', { ascending: true })

    if (siblingsError) {
      console.error('[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur siblings:', siblingsError)
      return { success: false, message: `Erreur lors de la récupération de la fratrie: ${siblingsError.message}`, data: null }
    }

    // Mapper les siblings en ajoutant whatsapp_phone comme null (colonne peut ne pas exister)
    const siblingsData = (siblings ?? []).map((s) => ({
      ...s,
      whatsapp_phone: null, // La colonne peut ne pas exister dans la base de données
    })) as FamilyStudentContact[]

    const parents = buildParentContacts(siblingsData)
    const feesResponse = await getFeesWithNotesByFamilyId(student.family_id)

    if (!feesResponse.success) {
      console.error('[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur récupération fees:', feesResponse.message)
    }

    return {
      success: true,
      message: 'Profil famille récupéré',
      data: {
        family: family || null,
        siblings: siblingsData,
        parents,
        fees: feesResponse.success && feesResponse.data ? feesResponse.data : [],
      },
    }
  } catch (error) {
    console.error('[GET_FAMILY_PROFILE_SUMMARY_BY_STUDENT_ID] Erreur:', error)
    throw new Error('Erreur lors de la récupération des données famille')
  }
}
