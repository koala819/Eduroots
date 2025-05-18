import { NextRequest, NextResponse } from 'next/server'

import { TimeEnum } from '@/types/course'
import type { Student, Teacher } from '@/types/user'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

import { Course } from '@/backend/models/course.model'
import { User } from '@/backend/models/user.model'
import { validateRequest } from '@/lib/api.utils'
import type {
  CourseSessionDataType,
  StudentDataType,
  TeacherDataType,
} from '@/lib/import'
import bcrypt from 'bcryptjs'

// Fonction utilitaire pour valider les IDs
function validateId(id: string | number): string | null {
  const validatedId = String(id).trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(validatedId)) {
    const sanitizedId = validatedId.replace(/[\n\r]/g, '');
    console.warn(`ID invalide ignoré: ${sanitizedId}`)
    return null
  }
  return validatedId
}

export async function POST(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    const { teachers, courses, students, mergedTeachers, year } =
      await req.json()
    const logs: string[] = []

    // Debug: Vérifier les données d'entrée
    // console.log("\n=== DEBUG: DONNÉES D'ENTRÉE ===")
    // console.log("Nombre d'étudiants:", students?.length)
    // console.log("Exemple d'étudiant:", students?.[0])
    // console.log('================================\n')

    // Créer un map pour stocker les étudiants par professeur référent
    const studentsByTeacher =
      students?.reduce(
        (acc: Record<string, StudentDataType[]>, s: StudentDataType) => {
          // console.log('\n=== DEBUG: RÉDUCTION ===')
          // console.log('Étudiant:', s)
          // console.log('teacherId présent?', 'teacherId' in s)
          // console.log('teacherId valeur:', s.teacherId)
          // console.log('========================\n')

          if (s.teacherId) {
            // Validation du teacherId pour éviter l'injection de propriété
            const teacherId = String(s.teacherId).trim()
            if (!/^[a-zA-Z0-9_-]+$/.test(teacherId)) {
              console.warn(`ID de professeur invalide ignoré: ${teacherId}`)
              return acc
            }
            if (!acc[teacherId]) {
              acc[teacherId] = []
            }
            acc[teacherId].push(s)
          }
          return acc
        },
        {},
      ) || {}

    // Debug: Afficher les profs et leurs étudiants
    // console.log('\n=== DEBUG: PROFESSEURS ET ÉTUDIANTS ===')
    // console.log('studentsByTeacher', studentsByTeacher)
    // Object.entries(studentsByTeacher).forEach(([teacherId, students]) => {
    //   console.log(`\nProf ID: ${teacherId}`)
    //   console.log(
    //     'Étudiants:',
    //     (students as any[]).map((s) => s.id),
    //   )
    // })
    // console.log('=====================================\n')

    // Créer un map pour les IDs fusionnés
    const mergedTeacherMap =
      mergedTeachers?.reduce(
        (
          acc: Record<string, string>,
          mt: {
            originalId: string
            mergedId: string
          },
        ) => {
          // Validation des IDs pour éviter l'injection de propriété
          const originalId = String(mt.originalId).trim()
          const mergedId = String(mt.mergedId).trim()

          if (
            !/^[a-zA-Z0-9_-]+$/.test(originalId) ||
            !/^[a-zA-Z0-9_-]+$/.test(mergedId)
          ) {
            console.warn(
              `ID de professeur invalide ignoré dans la fusion: originalId=${originalId}, mergedId=${mergedId}`,
            )
            return acc
          }

          acc[originalId] = mergedId
          return acc
        },
        {},
      ) || {}

    // console.log('\n=== DEBUG: FUSION DES PROFESSEURS ===')
    // console.log('mergedTeachers:', mergedTeachers)
    // console.log('mergedTeacherMap:', mergedTeacherMap)
    // console.log('=====================================\n')

    /*----------------------------------------------------------
    1. Insérer les enseignants
    ----------------------------------------------------------*/
    const insertedTeachers = []
    const teacherIdMap: Record<string, string> = {} // Map pour stocker id métier -> _id MongoDB
    if (teachers && teachers.length > 0) {
      // console.log('\n\n\n[FIRST] teachers:', teachers)
      // console.log(
      //   '[IMPORT] Début insertion enseignants, nombre:',
      //   teachers.length,
      // )

      // Hacher les mots de passe avant l'insertion
      const hashedPassword = await bcrypt.hash(
        process.env.TEACHER_PWD || '@changer!',
        10,
      )

      // Créer un Set pour stocker les IDs uniques des enseignants de Excel
      const uniqueTeacherIdFromExcel = new Set<string>(
        teachers.map((t: TeacherDataType) => {
          // console.log('t', t)
          return t.id
        }),
      )
      // console.log('\n\n uniqueTeacherIdFromExcel', uniqueTeacherIdFromExcel)

      // Créer les documents des enseignants (un seul par ID)
      const teacherDataFormats: Teacher[] = Array.from(
        uniqueTeacherIdFromExcel,
      ).map((id) => {
        const teacher = teachers.find((t: TeacherDataType) => t.id === id)
        let gender: GenderEnum = GenderEnum.Masculin
        if (teacher?.gender === 'female' || teacher?.gender === 'féminin')
          gender = GenderEnum.Feminin
        else if (teacher?.gender === 'male' || teacher?.gender === 'masculin')
          gender = GenderEnum.Masculin

        // Récupérer les sujets des cours pour cet enseignant
        const teacherSubjects =
          courses
            ?.filter((c: CourseSessionDataType) => {
              // console.log('course', c)
              return c.teacherId === id
            })
            .map((c: CourseSessionDataType) => c.subject)
            .filter(Boolean) || []

        // les matières sont uniques
        const uniqueSubjects = Array.from(new Set(teacherSubjects))
        // console.log('\n\n\nteacherSubjects pour', id, ':', teacherSubjects)
        return {
          id: id,
          email: teacher?.email?.toLowerCase() || 'user@mail.fr',
          firstname: teacher?.firstname,
          lastname: teacher?.lastname,
          password: hashedPassword,
          role: UserRoleEnum.Teacher,
          gender,
          phone: teacher?.phone || '0123456789',
          isActive: true,
          deletedAt: null,
          subjects: uniqueSubjects,
        } as Teacher
      })

      // Insérer les enseignants et stocker leurs IDs
      for (const newTeacher of teacherDataFormats) {
        // console.log('[IMPORT] Tentative insertion enseignant:', newTeacher)
        const teacher = new User(newTeacher)
        const savedTeacher = await teacher.save()
        // Stocker l'ID MongoDB avec l'ID métier comme clé
        const teacherId = String(newTeacher.id).trim()
        if (!/^[a-zA-Z0-9_-]+$/.test(teacherId)) {
          console.warn(
            `ID de professeur invalide ignoré lors de la création du map: ${teacherId}`,
          )
          continue
        }
        teacherIdMap[teacherId] = savedTeacher._id.toString()
        insertedTeachers.push(savedTeacher)
        // console.log('newTeacher.id', newTeacher.id)
        // console.log('teacherIdMap[newTeacher.id]', teacherIdMap[newTeacher.id])
      }

      logs.push(`${insertedTeachers.length} enseignants insérés.`)
    }

    /*----------------------------------------------------------
    2. Insérer les étudiants
    ----------------------------------------------------------*/
    const insertedStudents = []
    const studentIdMap: Record<string, string> = {} // Map pour stocker id métier -> _id MongoDB
    if (students && students.length > 0) {
      // console.log(
      //   '[IMPORT] Début insertion étudiants, nombre:',
      //   students.length,
      // )
      const hashedPassword = await bcrypt.hash(
        process.env.STUDENT_PWD || 'changeme',
        10,
      )

      const studentDataFormats: Student[] = students.map((s: any) => {
        let gender: GenderEnum = GenderEnum.Masculin
        if (s.gender === 'female' || s.gender === 'féminin')
          gender = GenderEnum.Feminin
        else if (s.gender === 'male' || s.gender === 'masculin')
          gender = GenderEnum.Masculin
        return {
          id: s.id,
          email: s.email?.toLowerCase() || '',
          firstname: s.firstname,
          lastname: s.lastname,
          password: hashedPassword,
          role: UserRoleEnum.Student,
          gender,
          phone: s.phone || '',
          isActive: true,
          deletedAt: null,
          type: UserType.Student,
          dateOfBirth: s.dateOfBirth || undefined,
        } as Student
      })

      for (const newStudent of studentDataFormats) {
        const student = new User(newStudent)
        const savedStudent = await student.save()
        // Stocker l'ID MongoDB avec l'ID Excel comme clé
        const studentId = validateId(newStudent.id)
        if (!studentId) continue
        studentIdMap[studentId] = savedStudent._id.toString()
        insertedStudents.push(savedStudent)
      }
      logs.push(`${insertedStudents.length} étudiants insérés.`)
    }

    // Debug: Afficher les profs et leurs étudiants avec les IDs MongoDB
    // console.log('\n=== DEBUG: PROFESSEURS ET ÉTUDIANTS (IDs MongoDB) ===')
    // Object.entries(studentsByTeacher).forEach(([teacherId, students]) => {
    //   const teacherMongoId = teacherIdMap[teacherId]
    //   console.log(`\nProf ID Excel: ${teacherId} -> MongoDB: ${teacherMongoId}`)
    //   console.log(
    //     'Étudiants:',
    //     (students as any[]).map((s) => ({
    //       idExcel: s.id,
    //       idMongo: studentIdMap[s.id],
    //     })),
    //   )
    // })
    // console.log('=====================================\n')

    /*----------------------------------------------------------
    3. Insérer les cours avec les IDs des professeurs et des étudiants
    ----------------------------------------------------------*/
    let insertedCourses = []
    if (courses && courses.length > 0) {
      // console.log('[IMPORT] Début insertion cours, nombre:', courses.length)

      // Regrouper les cours uniquement par professeur
      const groupedCourses = courses.reduce(
        (acc: any, c: CourseSessionDataType) => {
          // console.log('c', c)
          // Convertir l'ID Excel en ID MongoDB
          const originalTeacherId = mergedTeacherMap[c.teacherId] || c.teacherId
          const teacherMongoId = teacherIdMap[originalTeacherId]

          // console.log('\n=== DEBUG: CONVERSION ID PROFESSEUR ===')
          // console.log('ID Excel original:', c.teacherId)
          // console.log('ID Excel après fusion:', originalTeacherId)
          // console.log('ID MongoDB:', teacherMongoId)
          // console.log('=====================================\n')

          if (!teacherMongoId) {
            console.warn(`Professeur non trouvé pour l'ID ${c.teacherId}`)
            return acc
          }

          // Clé unique : professeur uniquement
          const key = teacherMongoId
          // Validation supplémentaire de la clé MongoDB
          if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            console.warn(`ID MongoDB invalide ignoré: ${key}`)
            return acc
          }
          // console.log('Clé de regroupement:', key)

          if (!acc[key]) {
            acc[key] = {
              teacher: [teacherMongoId],
              sessions: [],
              academicYear: year,
              isActive: true,
              deletedAt: null,
              stats: {},
            }
          }

          // Récupérer les étudiants de ce professeur et convertir leurs IDs
          // const teacherStudents = studentsByTeacher[c.teacherId] || []
          // console.log('\n=== DEBUG: ÉTUDIANTS DU PROFESSEUR ===')
          // console.log('ID Prof Excel:', c.teacherId)
          // console.log('Étudiants trouvés:', teacherStudents.length)
          // console.log(
          //   'Étudiants:',
          //   teacherStudents.map((s: ImportStudent) => ({
          //     id: s.id,
          //     teacherId: s.teacherId,
          //   })),
          // )
          // console.log('=====================================\n')

          // const studentIds = teacherStudents
          //   .map((s: any) => studentIdMap[s.id])
          //   .filter(Boolean)

          // Vérifier si une session similaire existe déjà
          const existingSession = acc[key].sessions.find(
            (s: any) =>
              s.timeSlot.dayOfWeek === c.dayOfWeek &&
              s.timeSlot.startTime === c.startTime &&
              s.timeSlot.endTime === c.endTime &&
              s.timeSlot.classroomNumber === parseInt(c.classroomNumber) &&
              s.subject === c.subject &&
              s.level === c.level &&
              s.sameStudents === false,
          )

          if (existingSession) {
            // Si une session existe déjà, on divise le créneau
            const isMorning = c.dayOfWeek.includes('morning')
            const isAfternoon = c.dayOfWeek.includes('afternoon')

            if (isMorning) {
              // Pour le matin
              if (
                existingSession.timeSlot.startTime === TimeEnum.MorningStart &&
                existingSession.timeSlot.endTime === TimeEnum.MorningEnd
              ) {
                // Récupérer les étudiants de ce professeur
                const teacherStudents = studentsByTeacher[c.teacherId] || []
                const studentIds = teacherStudents
                  .map((s: Student) => {
                    const id = validateId(s.id)
                    return id ? studentIdMap[id] : null
                  })
                  .filter(Boolean)

                // Première matière : 9h-10h45
                existingSession.timeSlot.endTime = TimeEnum.MorningPause
                existingSession.students = studentIds

                // Deuxième matière : 11h-12h30
                acc[key].sessions.push({
                  timeSlot: {
                    dayOfWeek: c.dayOfWeek,
                    startTime: TimeEnum.MorningPause,
                    endTime: TimeEnum.MorningEnd,
                    classroomNumber: parseInt(c.classroomNumber) || 1,
                  },
                  subject: c.subject,
                  level: c.level,
                  students: studentIds,
                  sameStudents: false,
                  stats: {},
                })
              }
            } else if (isAfternoon) {
              // Pour l'après-midi
              if (
                existingSession.timeSlot.startTime ===
                  TimeEnum.AfternoonStart &&
                existingSession.timeSlot.endTime === TimeEnum.AfternoonEnd
              ) {
                // Récupérer les étudiants de ce professeur
                const teacherStudents = studentsByTeacher[c.teacherId] || []
                const studentIds = teacherStudents
                  .map((s: Student) => {
                    const id = validateId(s.id)
                    return id ? studentIdMap[id] : null
                  })
                  .filter(Boolean)

                // Première matière : 14h-15h45
                existingSession.timeSlot.endTime = TimeEnum.AfternoonPause
                existingSession.students = studentIds

                // Deuxième matière : 16h-17h30
                acc[key].sessions.push({
                  timeSlot: {
                    dayOfWeek: c.dayOfWeek,
                    startTime: TimeEnum.AfternoonPause,
                    endTime: TimeEnum.AfternoonEnd,
                    classroomNumber: parseInt(c.classroomNumber) || 1,
                  },
                  subject: c.subject,
                  level: c.level,
                  students: studentIds,
                  sameStudents: false,
                  stats: {},
                })
              }
            }
          } else {
            // Si aucune session similaire n'existe, on ajoute la session normale
            // Récupérer les étudiants de ce professeur
            const teacherStudents = studentsByTeacher[c.teacherId] || []
            const studentIds = teacherStudents
              .map((s: Student) => {
                const id = validateId(s.id)
                return id ? studentIdMap[id] : null
              })
              .filter(Boolean)

            acc[key].sessions.push({
              timeSlot: {
                dayOfWeek: c.dayOfWeek,
                startTime: c.startTime,
                endTime: c.endTime,
                classroomNumber: parseInt(c.classroomNumber) || 1,
              },
              subject: c.subject,
              level: c.level,
              students: studentIds,
              sameStudents: false,
              stats: {}, // Laisser vide, Mongoose/Middleware pourra compléter
            })
          }

          return acc
        },
        {},
      )

      const coursesToInsert = Object.values(groupedCourses)
      // console.log('Nombre de cours après regroupement:', coursesToInsert.length)
      // console.log('Cours regroupés:', JSON.stringify(groupedCourses, null, 2))

      insertedCourses = await Course.insertMany(coursesToInsert, {
        ordered: false,
      })
      logs.push(`${insertedCourses.length} cours insérés.`)
    }

    return NextResponse.json({
      success: true,
      message: 'Base créée avec succès',
      logs,
    })
  } catch (error: any) {
    console.error('Erreur lors de la création de la base:', error)
    return NextResponse.json(
      { success: false, error: error.message || error, stack: error.stack },
      { status: 500 },
    )
  }
}
