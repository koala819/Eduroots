import { NextRequest, NextResponse } from 'next/server'

import { createClient } from '@/server/utils/supabase'
import { TimeEnum } from '@/types/courses'
import { Database } from '@/types/db'
import { GenderEnum,UserRoleEnum } from '@/types/user'

function normalizeFamilyValue(value?: string): string {
  if (!value) return ''
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function getFamilyKey(lastname?: string, email?: string, phone?: string): string {
  const nameKey = normalizeFamilyValue(lastname) || 'inconnu'
  const contactValue = normalizeFamilyValue(email || phone)
  const contactKey = contactValue.replace(/[^a-z0-9]/g, '') || 'inconnu'
  return `${nameKey}:${contactKey}`
}

function getFamilyLabel(lastname?: string): string {
  const name = lastname?.trim()
  return name ? `Famille ${name}` : 'Famille inconnue'
}

// Fonction utilitaire pour échapper les logs de manière sécurisée
function sanitizeForLog(value: string | number): string {
  const sanitizedValue = String(value)
    .replace(/[\n\r]/g, ' ') // Supprimer les sauts de ligne
    .replace(/[^\x20-\x7E]/g, '') // Garder seulement les caractères ASCII imprimables
    .replace(/["'`<>]/g, '') // Supprimer les caractères de citation et balises HTML
    .replace(/\\/g, '\\\\') // Échapper les barres obliques inverses
    .substring(0, 100) // Limiter la longueur
    // Préfixer avec "USER_INPUT:" pour le marquer comme contrôlé par l'utilisateur
  return `"USER_INPUT:${sanitizedValue}"`
}

// Fonction utilitaire pour valider les IDs
function validateId(id: string | number): string | null {
  const validatedId = String(id).trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(validatedId)) {
    console.warn(`ID invalide ignoré: ${sanitizeForLog(validatedId)}`)
    return null
  }
  return validatedId
}

// Types spécifiques pour l'import (format Excel)
type ImportTeacher = {
  id: string
  firstname: string
  lastname: string
  email?: string
  gender?: string
  phone?: string
}

type ImportStudent = {
  id: string
  firstname: string
  lastname: string
  email?: string
  gender?: string
  phone?: string
  dateOfBirth?: string
  teacherId?: string
}

type ImportCourse = {
  teacherId: string
  subject: string
  level: string
  dayOfWeek: string
  startTime: string
  endTime: string
  classroomNumber: string
}

type ImportMergedTeacher = {
  originalId: string
  mergedId: string
}

type CourseStats = {
  average_attendance?: number
  average_grade?: number
  average_behavior?: number
  last_updated?: Date
}

type GroupedCourse = {
  teacher_id: string
  academic_year: string
  is_active: boolean
  sessions: {
    subject: string
    level: string
    timeslot: {
      day_of_week: string
      start_time: string
      end_time: string
      classroom_number: string
    }
    stats: CourseStats
    same_students: boolean
    students: string[]
  }[]
}

export async function POST(req: NextRequest) {
  try {
    const { teachers, courses, students, mergedTeachers, year } = await req.json()
    const logs: string[] = []
    const supabase = await createClient()

    // Créer un map pour stocker les étudiants par professeur référent
    const studentsByTeacher = students?.reduce(
      (acc: Record<string, ImportStudent[]>, s: ImportStudent) => {
        if (s.teacherId) {
          const validatedTeacherId = validateId(s.teacherId)
          if (!validatedTeacherId) {
            console.warn(`ID de professeur invalide ignoré: ${sanitizeForLog(s.teacherId)}`)
            return acc
          }
          if (!acc[validatedTeacherId]) {
            acc[validatedTeacherId] = []
          }
          acc[validatedTeacherId].push(s)
        }
        return acc
      },
      {},
    ) ?? {}

    // 1. Importation des professeurs
    const teacherIdMap: Record<string, string> = {}
    if (teachers?.length > 0) {
      const teacherData: Database['education']['Tables']['users']['Insert'][] =
        teachers.map((t: ImportTeacher) => {
          const validatedId = validateId(t.id)
          if (!validatedId) {
            console.warn(`ID de professeur invalide ignoré: ${sanitizeForLog(t.id)}`)
            return null
          }
          return {
            firstname: t.firstname,
            lastname: t.lastname,
            email: t.email?.toLowerCase() ?? 'user@mail.fr',
            role: UserRoleEnum.Teacher,
            gender: t.gender === 'female' || t.gender === 'féminin'
              ? GenderEnum.Feminin
              : GenderEnum.Masculin,
            phone: t.phone ?? '0123456789',
            is_active: true,
            subjects: Array.from(new Set(
              courses
                ?.filter((c: ImportCourse) => c.teacherId === validatedId)
                .map((c: ImportCourse) => c.subject)
                .filter(Boolean) ?? [],
            )),
          }
        }).filter(Boolean) as Database['education']['Tables']['users']['Insert'][]

      const { data: insertedTeachers, error: teacherError } = await supabase
        .schema('education')
        .from('users')
        .insert(teacherData)
        .select()

      if (teacherError) throw teacherError

      insertedTeachers?.forEach((teacher, index) => {
        const validatedId = validateId(teachers[index].id)
        if (validatedId) {
          teacherIdMap[validatedId] = teacher.id
        }
      })

      logs.push(`${insertedTeachers?.length} enseignants insérés.`)
    }

    // 2. Importation des étudiants
    const studentIdMap: Record<string, string> = {}
    if (students?.length > 0) {
      const studentInsertEntries = students.map((s: ImportStudent, index: number) => {
        const validatedId = validateId(s.id)
        const importKey = validatedId ?? `row-${index + 1}`
        return {
          importKey,
          familyKey: getFamilyKey(s.lastname, s.email, s.phone),
          familyLabel: getFamilyLabel(s.lastname),
          insert: {
            firstname: s.firstname,
            lastname: s.lastname,
            email: s.email?.toLowerCase() ?? '',
            role: UserRoleEnum.Student,
            gender: s.gender === 'female' || s.gender === 'féminin'
              ? GenderEnum.Feminin
              : GenderEnum.Masculin,
            phone: s.phone ?? '',
            is_active: true,
            date_of_birth: s.dateOfBirth ? new Date(s.dateOfBirth) : null,
            type: 'student',
          } as Database['education']['Tables']['users']['Insert'],
        }
      })

      const { data: insertedStudents, error: studentError } = await supabase
        .schema('education')
        .from('users')
        .insert(studentInsertEntries.map((entry: { insert: Database['education']['Tables']['users']['Insert'] }) => entry.insert))
        .select()

      if (studentError) throw studentError

      const familyGroups = new Map<string, {label: string; studentIds: string[]}>()

      insertedStudents?.forEach((student, index) => {
        const entry = studentInsertEntries[index]
        studentIdMap[entry.importKey] = student.id

        const group = familyGroups.get(entry.familyKey)
        if (group) {
          group.studentIds.push(student.id)
        } else {
          familyGroups.set(entry.familyKey, {
            label: entry.familyLabel,
            studentIds: [student.id],
          })
        }
      })

      logs.push(`${insertedStudents?.length} étudiants insérés.`)

      if (familyGroups.size > 0) {
        const familyEntries = Array.from(familyGroups.entries()).map(([key, group]) => ({
          familyKey: key,
          label: group.label,
          studentIds: group.studentIds,
        }))

        const { data: insertedFamilies, error: familyError } = await supabase
          .schema('education')
          .from('families')
          .insert(familyEntries.map((entry) => ({
            label: entry.label,
            divorced: false,
            is_active: true,
          })))
          .select('id')

        if (familyError) throw familyError

        const updatePromises = insertedFamilies?.map((family, index) => {
          const entry = familyEntries[index]
          if (!entry?.studentIds?.length) return null
          return supabase
            .schema('education')
            .from('users')
            .update({ family_id: family.id })
            .in('id', entry.studentIds)
        }).filter(Boolean) ?? []

        if (updatePromises.length > 0) {
          await Promise.all(updatePromises)
          logs.push('Family_id affecté aux étudiants.')
        }

        logs.push(`${insertedFamilies?.length ?? 0} familles créées.`)
      }
    }

    // 3. Importation des cours
    if (courses?.length > 0) {
      // Regrouper les cours par professeur
      const groupedCourses: Record<string, GroupedCourse> =
        courses.reduce((acc: Record<string, GroupedCourse>, c: ImportCourse) => {
          const validatedTeacherId = validateId(c.teacherId)
          if (!validatedTeacherId) {
            console.warn(`ID de professeur invalide ignoré pour le cours:
              [${sanitizeForLog(c.teacherId)}]`)
            return acc
          }

          const teacherId = teacherIdMap[
            mergedTeachers?.find(
              (mt: ImportMergedTeacher) => mt.originalId === validatedTeacherId,
            )?.mergedId ?? validatedTeacherId
          ]
          if (!teacherId) return acc

          if (!acc[teacherId]) {
            acc[teacherId] = {
              teacher_id: teacherId,
              academic_year: year,
              is_active: true,
              sessions: [],
            }
          }

          // Vérifier si c'est un créneau matin ou après-midi
          const isMorning = c.dayOfWeek.includes('morning')
          const isAfternoon = c.dayOfWeek.includes('afternoon')

          // Dans la partie de gestion des cours, ajouter la récupération des étudiants :
          const teacherStudents = studentsByTeacher[c.teacherId] ?? []
          const studentIds = teacherStudents
            .map((s: ImportStudent) => {
              const id = validateId(s.id)
              return id ? studentIdMap[id] : null
            })
            .filter(Boolean)

          if (isMorning || isAfternoon) {
            // Diviser le créneau en deux si nécessaire
            const [firstSession, secondSession] = isMorning
              ? [
                { start: TimeEnum.MorningStart, end: TimeEnum.MorningPause },
                { start: TimeEnum.MorningPause, end: TimeEnum.MorningEnd },
              ]
              : [
                { start: TimeEnum.AfternoonStart, end: TimeEnum.AfternoonPause },
                { start: TimeEnum.AfternoonPause, end: TimeEnum.AfternoonEnd },
              ]

            // Première session
            acc[teacherId].sessions.push({
              subject: c.subject,
              level: c.level,
              timeslot: {
                day_of_week: c.dayOfWeek,
                start_time: firstSession.start,
                end_time: firstSession.end,
                classroom_number: c.classroomNumber,
              },
              stats: {} as CourseStats,
              same_students: false,
              students: studentIds,
            })

            // Deuxième session
            acc[teacherId].sessions.push({
              subject: c.subject,
              level: c.level,
              timeslot: {
                day_of_week: c.dayOfWeek,
                start_time: secondSession.start,
                end_time: secondSession.end,
                classroom_number: c.classroomNumber,
              },
              stats: {} as CourseStats,
              same_students: false,
              students: studentIds,
            })
          }

          return acc
        }, {} as Record<string, GroupedCourse>)

      // Insérer les cours et leurs sessions
      for (const [teacherId, courseData] of Object.entries(groupedCourses)) {
        // 1. Insérer le cours
        const { data: course, error: courseError } = await supabase
          .schema('education')
          .from('courses')
          .insert({
            academic_year: courseData.academic_year,
            is_active: courseData.is_active,
          })
          .select()
          .single()

        if (courseError) throw courseError

        // 2. Lier le professeur au cours
        await supabase
          .schema('education')
          .from('courses_teacher')
          .insert({
            course_id: course.id,
            teacher_id: teacherId,
          })

        // 3. Insérer les sessions
        for (const session of courseData.sessions) {
          const { data: courseSession, error: sessionError } = await supabase
            .schema('education')
            .from('courses_sessions')
            .insert({
              course_id: course.id,
              subject: session.subject,
              level: session.level,
            })
            .select()
            .single()

          if (sessionError) throw sessionError

          // 4. Insérer le créneau horaire
          await supabase
            .schema('education')
            .from('courses_sessions_timeslot')
            .insert({
              course_sessions_id: courseSession.id,
              day_of_week: session.timeslot.day_of_week,
              start_time: session.timeslot.start_time,
              end_time: session.timeslot.end_time,
              classroom_number: session.timeslot.classroom_number,
            })
        }
      }

      logs.push(`${Object.keys(groupedCourses).length} cours insérés.`)
    }

    return NextResponse.json({
      success: true,
      message: 'Base créée avec succès',
      logs,
    })

  } catch (error: any) {
    console.error('Erreur lors de la création de la base:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message ?? error,
        stack: error.stack,
      },
      { status: 500 },
    )
  }
}
