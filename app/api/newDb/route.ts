import { NextRequest, NextResponse } from 'next/server'

import { TimeEnum } from '@/types/course'
import type { Student, Teacher } from '@/types/user'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

import { Course } from '@/backend/models/course.model'
import { User } from '@/backend/models/user.model'
import { validateRequest } from '@/lib/api.utils'
import type { CourseSessionDataType, TeacherDataType } from '@/lib/import'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  const authError = await validateRequest(req)
  if (authError) return authError

  try {
    // dbConnect déjà appelé dans validateRequest
    const { teachers, courses, students } = await req.json()
    const logs: string[] = []

    // 1. Insérer les enseignants
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
          subjects: teacherSubjects,
        } as Teacher
      })

      // Insérer les enseignants et stocker leurs IDs
      for (const newTeacher of teacherDataFormats) {
        // console.log('[IMPORT] Tentative insertion enseignant:', newTeacher)
        const teacher = new User(newTeacher)
        const savedTeacher = await teacher.save()
        // Stocker l'ID MongoDB avec l'ID métier comme clé
        teacherIdMap[newTeacher.id] = savedTeacher._id.toString()
        insertedTeachers.push(savedTeacher)
        console.log('newTeacher.id', newTeacher.id)
        console.log('teacherIdMap[newTeacher.id]', teacherIdMap[newTeacher.id])
      }

      logs.push(`${insertedTeachers.length} enseignants insérés.`)
    }

    // 2. Insérer les cours avec les IDs des professeurs
    let insertedCourses = []
    if (courses && courses.length > 0) {
      console.log('[IMPORT] Début insertion cours, nombre:', courses.length)

      // Regrouper les cours uniquement par professeur
      const groupedCourses = courses.reduce(
        (acc: any, c: CourseSessionDataType) => {
          console.log('c', c)
          const teacherMongoId = teacherIdMap[c.teacherId]
          if (!teacherMongoId) {
            console.warn(`Professeur non trouvé pour l'ID ${c.teacherId}`)
            return acc
          }

          // Clé unique : professeur uniquement
          const key = teacherMongoId
          console.log('Clé de regroupement:', key)

          if (!acc[key]) {
            acc[key] = {
              teacher: [teacherMongoId],
              sessions: [],
              academicYear: '2024',
              isActive: true,
              deletedAt: null,
              stats: {},
            }
          }

          // Vérifier si une session similaire existe déjà (même jour, même créneau, même salle)
          const existingSession = acc[key].sessions.find(
            (s: any) =>
              s.timeSlot.dayOfWeek === c.dayOfWeek &&
              s.timeSlot.startTime === c.startTime &&
              s.timeSlot.endTime === c.endTime &&
              s.timeSlot.classroomNumber === parseInt(c.classroomNumber),
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
                // Première matière : 9h-10h45
                existingSession.timeSlot.endTime = TimeEnum.MorningPause
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
                  students: [],
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
                // Première matière : 14h-15h45
                existingSession.timeSlot.endTime = TimeEnum.AfternoonPause
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
                  students: [],
                  sameStudents: false,
                  stats: {},
                })
              }
            }
          } else {
            // Si aucune session similaire n'existe, on ajoute la session normale
            acc[key].sessions.push({
              timeSlot: {
                dayOfWeek: c.dayOfWeek,
                startTime: c.startTime,
                endTime: c.endTime,
                classroomNumber: parseInt(c.classroomNumber) || 1,
              },
              subject: c.subject,
              level: c.level,
              students: [],
              sameStudents: false,
              stats: {}, // Laisser vide, Mongoose/Middleware pourra compléter
            })
          }

          return acc
        },
        {},
      )

      const coursesToInsert = Object.values(groupedCourses)
      console.log('Nombre de cours après regroupement:', coursesToInsert.length)
      console.log('Cours regroupés:', JSON.stringify(groupedCourses, null, 2))

      insertedCourses = await Course.insertMany(coursesToInsert, {
        ordered: false,
      })
      logs.push(`${insertedCourses.length} cours insérés.`)
    }

    // 3. Insérer les étudiants
    const insertedStudents = []
    if (students && students.length > 0) {
      console.log(
        '[IMPORT] Début insertion étudiants, nombre:',
        students.length,
      )
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
        // console.log('[IMPORT] Tentative insertion étudiant:', newStudent)
        const student = new User(newStudent)
        const savedStudent = await student.save()
        insertedStudents.push(savedStudent)
      }
      logs.push(`${insertedStudents.length} étudiants insérés.`)
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
