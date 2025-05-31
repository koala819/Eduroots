import {CourseSession, TimeSlotEnum} from '@/types/course'
import {GenderEnum, User} from '@/types/user'

import dbConnect from '@/backend/config/dbConnect'
import {Course as CourseCollection} from '@/backend/models/course.model'
import {User as UserCollection} from '@/backend/models/user.model'
import {formatDayOfWeek} from '@/lib/utils'
import {differenceInYears} from 'date-fns'

const CURRENT_ACADEMIC_YEAR = '2024'

export interface TeacherSession {
  dayOfWeek: string
  students?: {id: string; firstname: string; lastname: string}[]
  sameStudents: boolean
}

interface TeacherCourse {
  courseId: string
  subject: string
  level: string
  sessions: TeacherSession[]
}

export interface TeacherSessionInfo {
  teacherId: string
  workDays: string[]
  courses: TeacherCourse[]
}

export interface TeacherAnalytics {
  substituteTeachers: {id: string; name: string}[]
  teacherCategories: Record<string, TeacherSessionInfo[]>
  teacherMap: Map<string, string>
  //   teacherStats: Record<string, any>
}

// Fonction principale d'analyse des sessions de professeurs
export async function analyzeTeacherSessions(): Promise<TeacherAnalytics> {
  try {
    // Connexion à la base de données
    await dbConnect()

    // Récupérer tous les professeurs
    const teachers = await UserCollection.find({role: 'teacher'})

    // Récupérer tous les cours actifs pour l'année académique
    const courses = await CourseCollection.find({
      academicYear: CURRENT_ACADEMIC_YEAR,
      isActive: true,
    })

    // Trouver les professeurs remplaçants
    const substituteTeachers = await findSubstituteTeachers(teachers, courses)

    // Créer une map des professeurs pour un accès rapide
    const teacherMap = new Map(
      teachers.map((teacher) => [
        teacher._id.toString(),
        `${teacher.firstname} ${teacher.lastname}`,
      ]),
    )

    // Catégoriser les professeurs par leurs jours de travail
    const teacherCategories: {
      [key: string]: TeacherSessionInfo[]
    } = {
      [TimeSlotEnum.SATURDAY_MORNING]: [],
      [TimeSlotEnum.SATURDAY_AFTERNOON]: [],
      [TimeSlotEnum.SUNDAY_MORNING]: [],
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SATURDAY_AFTERNOON}`]: [],
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SUNDAY_MORNING}`]: [],
      [`${TimeSlotEnum.SATURDAY_AFTERNOON}+${TimeSlotEnum.SUNDAY_MORNING}`]: [],
      [`${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SATURDAY_AFTERNOON}+${TimeSlotEnum.SUNDAY_MORNING}`]:
        [],
    }

    // Map pour stocker les informations des professeurs
    const teacherInfoMap = new Map<string, TeacherSessionInfo>()

    // Analyser chaque cours
    for (const course of courses) {
      // Récupérer tous les IDs des professeurs pour ce cours
      const teacherIds = course.teacher.map((id: {toString(): string}) => id.toString())

      for (const teacherId of teacherIds) {
        // Initialiser l'info du professeur s'il n'existe pas encore
        if (!teacherInfoMap.has(teacherId)) {
          teacherInfoMap.set(teacherId, {
            teacherId,
            workDays: [],
            courses: [],
          })
        }

        const teacherInfo = teacherInfoMap.get(teacherId)!

        // Ajouter ce cours aux informations du professeur
        const courseInfo: TeacherCourse = {
          courseId: course._id.toString(),
          subject: course.sessions[0]?.subject || 'Non spécifié',
          level: course.sessions[0]?.level || 'Non spécifié',
          sessions: [],
        }

        // Récupérer les jours de travail de ce cours
        for (const session of course.sessions) {
          // Ajouter le jour à la liste des jours de travail du professeur s'il n'est pas déjà présent
          if (!teacherInfo.workDays.includes(session.timeSlot.dayOfWeek)) {
            teacherInfo.workDays.push(session.timeSlot.dayOfWeek)
          }

          // Ajouter les informations de session
          courseInfo.sessions.push({
            dayOfWeek: formatDayOfWeek(session.timeSlot.dayOfWeek),
            students: session.students,
            sameStudents: session.sameStudents as any,
          })
        }

        // Ajouter le cours aux informations du professeur
        teacherInfo.courses.push(courseInfo)
      }
    }

    // Catégoriser les professeurs selon leurs jours de travail
    for (const [_, teacherInfo] of Array.from(teacherInfoMap.entries())) {
      // Trier les jours de travail
      teacherInfo.workDays.sort()

      // Déterminer la catégorie en fonction des jours de travail
      let category: string | undefined

      if (teacherInfo.workDays.length === 1) {
        // Un seul jour de travail
        category = teacherInfo.workDays[0]
      } else if (teacherInfo.workDays.length === 2) {
        // Deux jours de travail
        category = `${teacherInfo.workDays[0]}+${teacherInfo.workDays[1]}`
      } else if (teacherInfo.workDays.length === 3) {
        // Trois jours de travail
        category = `${TimeSlotEnum.SATURDAY_MORNING}+${TimeSlotEnum.SATURDAY_AFTERNOON}+${TimeSlotEnum.SUNDAY_MORNING}`
      }

      // Ajouter le professeur à sa catégorie
      if (category && teacherCategories[category] !== undefined) {
        teacherCategories[category].push(teacherInfo)
      }
    }

    // Récupérer tous les utilisateurs pour accéder aux données des étudiants
    const users = await UserCollection.find({})

    // Calculer les statistiques des professeurs
    // const teacherStats = calculateTeacherStats(teacherInfoMap)

    return {
      substituteTeachers,
      teacherCategories,
      teacherMap,
      //   teacherStats,
    }
  } catch (error) {
    console.error("Erreur lors de l'analyse des sessions:", error)
    throw error
  }
}

export async function calculateStudentAgeStatistics(studentIds: string[]): Promise<{
  minAge: number
  maxAge: number
  averageAge: number
}> {
  try {
    // Ensure database connection
    await dbConnect()

    // Find students with specified IDs and valid date of birth
    const students = await UserCollection.find({
      _id: studentIds,
      role: 'student',
      dateOfBirth: {$ne: null},
    }).select('dateOfBirth')

    // Calculate ages
    const ages = students
      .map((student) => {
        if (!student.dateOfBirth) return null

        return differenceInYears(new Date(), new Date(student.dateOfBirth))
      })
      .filter((age): age is number => age !== null)

    // If no students with valid ages
    if (ages.length === 0) {
      return {
        minAge: 0,
        maxAge: 0,
        averageAge: 0,
      }
    }

    // Calculate statistics
    const minAge = Math.min(...ages)
    const maxAge = Math.max(...ages)
    const averageAge = ages.reduce((a, b) => a + b, 0) / ages.length

    return {
      minAge,
      maxAge,
      averageAge: Number(averageAge.toFixed(1)),
    }
  } catch (error) {
    console.error('Error calculating student age statistics:', error)
    throw error
  }
}

// Calculer la distribution de genre pour un ensemble d'IDs d'étudiants
export async function calculateGenderDistribution(studentIds: string[]) {
  try {
    // Récupérer les utilisateurs avec leurs genres
    const students = await UserCollection.find({
      _id: studentIds,
      role: 'student',
    }).select('gender')

    // Initialiser les compteurs de genre
    const genderCounts = {
      [GenderEnum.Masculin]: 0,
      [GenderEnum.Feminin]: 0,
      undefined: 0,
    }

    // Compter les genres
    students.forEach((student) => {
      const gender: keyof typeof genderCounts =
        student.gender === 'féminin'
          ? GenderEnum.Feminin
          : student.gender === 'masculin'
            ? GenderEnum.Masculin
            : 'undefined'
      genderCounts[gender]++
    })

    // Calculer les pourcentages
    const totalStudents = students.length
    const genderDistribution = {
      genderDistribution: {
        counts: {
          [GenderEnum.Masculin]: genderCounts[GenderEnum.Masculin],
          [GenderEnum.Feminin]: genderCounts[GenderEnum.Feminin],
          undefined: genderCounts['undefined'],
        },
        percentages: {
          [GenderEnum.Masculin]:
            totalStudents > 0
              ? ((genderCounts[GenderEnum.Masculin] / totalStudents) * 100).toFixed(2)
              : '0',
          [GenderEnum.Feminin]:
            totalStudents > 0
              ? ((genderCounts[GenderEnum.Feminin] / totalStudents) * 100).toFixed(2)
              : '0',
          undefined:
            totalStudents > 0
              ? ((genderCounts['undefined'] / totalStudents) * 100).toFixed(2)
              : '0',
        },
      },
    }

    return genderDistribution
  } catch (error) {
    console.error('Erreur lors du calcul de la distribution de genre:', error)
    throw error
  }
}

export async function calculateTeacherStats(teacherId: string) {
  try {
    const studentIds = await collectStudentsFromTeacher(teacherId)

    const genderDistribution = await calculateGenderDistribution(studentIds)

    const ageStatistics = await calculateStudentAgeStatistics(studentIds)

    const stats = {
      totalStudents: studentIds.length,
      ...genderDistribution,
      ...ageStatistics,
    }

    return stats
  } catch (error) {
    console.error(`Erreur lors du calcul des statistiques pour le professeur ${teacherId}:`, error)
    throw error
  }
}

// Collect all students for a specific teacher
export async function collectStudentsFromTeacher(teacherId: string): Promise<string[]> {
  try {
    // Find the teacher record
    const teacherRecord = await CourseCollection.find({
      teacher: teacherId,
      academicYear: CURRENT_ACADEMIC_YEAR,
      isActive: true,
    })

    // Collect unique student IDs
    const studentIds = new Set<string>()

    teacherRecord.forEach((courseDoc) => {
      // Use .toObject() to convert Mongoose document to a plain JavaScript object
      const course = courseDoc.toObject()

      course.sessions.forEach((session: CourseSession) => {
        if (session.students) {
          session.students.forEach((student) => {
            studentIds.add(student.toString())
          })
        }
      })
    })

    return Array.from(studentIds)
  } catch (error) {
    console.error('Error collecting students for teacher:', error)
    throw error
  }
}

// Obtenir le nombre de cours pour un professeur spécifique
export function getTeacherCourseCount(teacherInfo: TeacherSessionInfo): {
  teacherName: string
  teacherId: string
  courseCount: number
} {
  return {
    teacherName: teacherInfo.teacherId, // Note: remplacer par le nom réel si nécessaire
    teacherId: teacherInfo.teacherId,
    courseCount: countTeacherCourses(teacherInfo.courses),
  }
}

// Compter les cours en fonction des groupes de sessions
function countCoursesBySessionGroups(course: TeacherCourse): number {
  // Grouper les sessions par même jour
  const sessionsByDay = course.sessions.reduce(
    (acc, session) => {
      const day = session.dayOfWeek
      if (!acc[day]) {
        acc[day] = []
      }
      acc[day].push(session)
      return acc
    },
    {} as Record<string, TeacherSession[]>,
  )

  let totalCourses = 0

  // Parcourir chaque groupe de sessions par jour
  for (const day in sessionsByDay) {
    const sessionsOnDay = sessionsByDay[day]

    // Si 2 sessions dans la même journée
    if (sessionsOnDay.length === 2) {
      // Vérifier si ce sont les mêmes étudiants
      const session1Students = sessionsOnDay[0].students
        ? new Set(sessionsOnDay[0].students.map((id) => id.id.toString()))
        : new Set()
      const session2Students = sessionsOnDay[1].students
        ? new Set(sessionsOnDay[1].students.map((id) => id.id.toString()))
        : new Set()

      // Si les deux ensembles d'étudiants sont identiques, compter comme 1 cours
      if (
        session1Students.size === session2Students.size &&
        Array.from(session1Students).every((student) => session2Students.has(student))
      ) {
        totalCourses += 1
      } else {
        // Sinon, compter comme 2 cours distincts
        totalCourses += 2
      }
    } else {
      // Si plus de 2 sessions dans la même journée, compter chaque session
      totalCourses += sessionsOnDay.length
    }
  }

  return totalCourses
}

// Compter le nombre total de cours pour un professeur
function countTeacherCourses(courses: TeacherCourse[]): number {
  let totalCourses = 0

  courses.forEach((course) => {
    // Cours avec 2, 4 ou 6 sessions
    if ([2, 4, 6].includes(course.sessions.length)) {
      const courseCount = countCoursesBySessionGroups(course)
      totalCourses += courseCount
    }
  })

  return totalCourses
}

// Trouver les professeurs remplaçants
async function findSubstituteTeachers(
  teachers: User[],
  courses: any[],
): Promise<{id: string; name: string}[]> {
  // Créer un ensemble des IDs de professeurs dans les cours
  const teacherIdsInCourses = new Set(
    courses.flatMap((course) => course.teacher.map((id: {toString(): string}) => id.toString())),
  )

  // Trouver les professeurs remplaçants (professeurs non présents dans les cours)
  const substituteTeachers = teachers
    .filter((teacher) => !teacherIdsInCourses.has(teacher._id.toString()))
    .map((teacher) => ({
      id: teacher._id.toString(),
      name: `${teacher.firstname} ${teacher.lastname}`,
    }))

  return substituteTeachers
}
