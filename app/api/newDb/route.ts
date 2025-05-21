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

// Fonction utilitaire pour valider les IDs
function validateId(id: string | number): string | null {
  const validatedId = String(id).trim()
  if (!/^[a-zA-Z0-9_-]+$/.test(validatedId)) {
    const sanitizedId = validatedId.replace(/[\n\r]/g, '')
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

    // Vérification stricte des mots de passe d'import
    if (!process.env.STUDENT_PWD || !process.env.STUDENT_PWD.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La variable d'environnement STUDENT_PWD doit être définie et non vide pour importer les étudiants.",
        },
        { status: 400 },
      )
    }
    if (!process.env.TEACHER_PWD || !process.env.TEACHER_PWD.trim()) {
      return NextResponse.json(
        {
          success: false,
          error:
            "La variable d'environnement TEACHER_PWD doit être définie et non vide pour importer les enseignants.",
        },
        { status: 400 },
      )
    }

    // Créer un map pour stocker les étudiants par professeur référent
    const studentsByTeacher =
      students?.reduce(
        (acc: Record<string, StudentDataType[]>, s: StudentDataType) => {
          if (s.teacherId) {
            // Validation du teacherId pour éviter l'injection de propriété
            const teacherId = String(s.teacherId).trim()
            if (!/^[a-zA-Z0-9_-]+$/.test(teacherId)) {
              const sanitizedTeacherId = teacherId.replace(/[\n\r]/g, '')
              console.warn(
                `ID de professeur invalide ignoré: ${sanitizedTeacherId}`,
              )
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
            const sanitizedOriginalId = originalId.replace(/[\n\r]/g, '')
            const sanitizedMergedId = mergedId.replace(/[\n\r]/g, '')
            console.warn(
              `ID de professeur invalide ignoré dans la fusion: originalId=${sanitizedOriginalId}, mergedId=${sanitizedMergedId}`,
            )
            return acc
          }

          acc[originalId] = mergedId
          return acc
        },
        {},
      ) || {}

    /*----------------------------------------------------------
    1. Insérer les enseignants
    ----------------------------------------------------------*/
    const insertedTeachers = []
    const teacherIdMap: Record<string, string> = {} // Map pour stocker id métier -> _id MongoDB
    if (teachers && teachers.length > 0) {
      // Créer un Set pour stocker les IDs uniques des enseignants de Excel
      const uniqueTeacherIdFromExcel = new Set<string>(
        teachers.map((t: TeacherDataType) => {
          return t.id
        }),
      )

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
              return c.teacherId === id
            })
            .map((c: CourseSessionDataType) => c.subject)
            .filter(Boolean) || []

        // les matières sont uniques
        const uniqueSubjects = Array.from(new Set(teacherSubjects))
        return {
          id: id,
          email: teacher?.email?.toLowerCase() || 'user@mail.fr',
          firstname: teacher?.firstname,
          lastname: teacher?.lastname,
          password: process.env.TEACHER_PWD,
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
        const teacher = new User(newTeacher)
        const savedTeacher = await teacher.save()
        // Stocker l'ID MongoDB avec l'ID métier comme clé
        const teacherId = String(newTeacher.id).trim()
        if (!/^[a-zA-Z0-9_-]+$/.test(teacherId)) {
          const sanitizedTeacherId = teacherId.replace(/[\n\r]/g, '')
          console.warn(
            `ID de professeur invalide ignoré lors de la création du map: ${sanitizedTeacherId}`,
          )
          continue
        }
        teacherIdMap[teacherId] = savedTeacher._id.toString()
        insertedTeachers.push(savedTeacher)
      }

      logs.push(`${insertedTeachers.length} enseignants insérés.`)
    }

    /*----------------------------------------------------------
    2. Insérer les étudiants
    ----------------------------------------------------------*/
    const insertedStudents = []
    const studentIdMap: Record<string, string> = {} // Map pour stocker id métier -> _id MongoDB
    if (students && students.length > 0) {
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
          password: process.env.STUDENT_PWD,
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

    /*----------------------------------------------------------
    3. Insérer les cours avec les IDs des professeurs et des étudiants
    ----------------------------------------------------------*/
    const insertedCourses = []
    if (courses && courses.length > 0) {
      // Regrouper les cours uniquement par professeur
      const groupedCourses = courses.reduce(
        (acc: any, c: CourseSessionDataType) => {
          // Convertir l'ID Excel en ID MongoDB
          const originalTeacherId = mergedTeacherMap[c.teacherId] || c.teacherId
          const teacherMongoId = teacherIdMap[originalTeacherId]

          if (!teacherMongoId) {
            const sanitizedTeacherId = String(c.teacherId).replace(/\n|\r/g, '')
            console.warn(
              `Professeur non trouvé pour l'ID ${sanitizedTeacherId}`,
            )
            return acc
          }

          // Clé unique : professeur uniquement
          const key = teacherMongoId
          // Validation supplémentaire de la clé MongoDB
          if (!/^[a-zA-Z0-9_-]+$/.test(key)) {
            console.warn(`ID MongoDB invalide ignoré: ${key}`)
            return acc
          }

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

      for (const key in groupedCourses) {
        const courseData = groupedCourses[key]
        const course = new Course(courseData)
        const savedCourse = await course.save()
        insertedCourses.push(savedCourse)
      }
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
