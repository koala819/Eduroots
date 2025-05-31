import {BehaviorRecord} from '@/types/behavior'
import {SubjectNameEnum} from '@/types/course'
import {GradeRecord} from '@/types/grade'

import dbConnect from '@/backend/config/dbConnect'
import {Attendance} from '@/backend/models/attendance.model'
import {Behavior} from '@/backend/models/behavior.model'
import {Grade} from '@/backend/models/grade.model'
import {StudentStats} from '@/backend/models/student-stats.model'

export async function calculateStudentAttendanceRate(studentId: string) {
  try {
    // Ensure database connection
    await dbConnect()

    // Récupérer tous les enregistrements de présence pour cet étudiant
    const attendanceRecords = await Attendance.find({
      'records.student': studentId,
    }).sort({date: -1})

    console.log('📊 Enregistrements de présence trouvés:', attendanceRecords.length)

    // Calculer les statistiques de présence
    let totalSessions = 0
    let absencesCount = 0
    const absences: {date: Date; course: string}[] = []

    attendanceRecords.forEach((attendance) => {
      // Filtrer uniquement les enregistrements de ce student
      const studentRecord = attendance.records.find(
        (r: {student: {toString: () => string}}) => r.student.toString() === studentId,
      )

      if (studentRecord) {
        totalSessions++
        if (!studentRecord.isPresent) {
          absencesCount++
          absences.push({
            date: attendance.date as any,
            course: attendance.course.toString(),
          })
        }
      }
    })

    // Calculer le taux d'absence
    const absencesRate = totalSessions > 0 ? (absencesCount / totalSessions) * 100 : 0

    // Récupérer la dernière date d'activité
    const lastActivity =
      attendanceRecords.length > 0
        ? attendanceRecords[0].date // Puisque nous avons trié par date décroissante
        : null

    // Récupérer les statistiques existantes
    const existingStats = await StudentStats.findOne({userId: studentId})

    // Vérifier si les statistiques sont déjà à jour
    if (
      existingStats &&
      existingStats.absencesCount === absencesCount &&
      existingStats.absencesRate === absencesRate &&
      existingStats.absences.length === absences.length &&
      (existingStats.lastActivity as any)?.getTime() === (lastActivity as any)?.getTime()
    ) {
      console.log("📊 Statistiques déjà à jour pour l'étudiant:", studentId)
      return {
        studentId,
        totalSessions,
        absencesCount,
        lastActivity,
        absencesRate,
        absences,
      }
    }

    // Mettre à jour les statistiques de l'étudiant
    await StudentStats.findOneAndUpdate(
      {userId: studentId},
      {
        $set: {
          absencesRate,
          absencesCount,
          absences,
          lastActivity,
          lastUpdate: new Date(),
          // Préserver les champs existants
          behaviorAverage: existingStats?.behaviorAverage || 0,
          grades: existingStats?.grades || {overallAverage: 0},
        },
      },
      {upsert: true, new: true},
    )

    console.log('📊 Statistiques mises à jour:', {
      studentId,
      totalSessions,
      absencesRate,
      absencesCount,
      absences: absences.map((a) => ({
        date: a.date.toISOString(),
        course: a.course,
      })),
      lastActivity: (lastActivity as any)?.toISOString(),
    })

    return {
      studentId,
      totalSessions,
      absencesCount,
      lastActivity,
      absencesRate,
      absences,
    }
  } catch (error) {
    console.error('Erreur lors du calcul du taux de présence :', error)
    throw error
  }
}

export async function calculateStudentBehaviorRate(studentId: string) {
  try {
    // Ensure database connection
    await dbConnect()

    // Récupérer tous les enregistrements de comportement pour cet étudiant
    const behaviorRecords = await Behavior.find({
      records: {
        $elemMatch: {
          student: studentId,
        },
      },
    })

    // Objet pour tracker les dates uniques et leurs enregistrements
    const uniqueBehaviors: {[key: string]: any} = {}

    // Calculer les statistiques de comportement
    let totalSessions = 0
    let totalRatingSum = 0

    behaviorRecords.forEach((behavior) => {
      // Filtrer uniquement les enregistrements de ce student
      const studentRecord = behavior.records.find(
        (r: BehaviorRecord) => r.student.toString() === studentId,
      )

      if (studentRecord) {
        // Convertir la date en chaîne pour comparaison
        const dateString = behavior.date.toISOString().split('T')[0]

        // Vérifier si cette date a déjà été vue
        if (!uniqueBehaviors[dateString]) {
          uniqueBehaviors[dateString] = behavior
          totalSessions++

          // Si l'étudiant a reçu une note sur son comportement
          if (studentRecord.rating) {
            totalRatingSum += studentRecord.rating
          }
        }
      }
    })

    // Convertir l'objet en tableau pour les records
    const uniqueBehaviorRecords = Object.values(uniqueBehaviors)

    // Récupérer la dernière date de session
    const lastActivity =
      uniqueBehaviorRecords.length > 0
        ? uniqueBehaviorRecords.reduce((latest, current) =>
            current.date > latest.date ? current : latest,
          ).date
        : null

    // Calculer la moyenne de comportement
    const behaviorAverage =
      totalSessions > 0 ? Number((totalRatingSum / totalSessions).toFixed(2)) : 0

    return {
      studentId,
      behaviorAverage,
      lastActivity,
      records: uniqueBehaviorRecords,
    }
  } catch (error) {
    console.error('Erreur lors du calcul du taux de comportement :', error)
    throw error
  }
}

export async function calculateStudentGrade(studentId: string) {
  await dbConnect()

  // 1. Récupérer tous les enregistrements de notes
  const recordsGradeCollection = await Grade.find({
    records: {
      $elemMatch: {
        student: studentId,
        isAbsent: false,
      },
    },
  }).populate({
    path: 'course',
    select: 'sessions',
  })

  // 2. Vérifier si l'étudiant a des notes
  const hasGrades = recordsGradeCollection.length > 0

  // Structure pour stocker les notes par matière
  const subjectGrades: {
    [key in SubjectNameEnum]?: {
      grades: number[]
      average?: number
    }
  } = {}

  // Initialiser les matières
  Object.values(SubjectNameEnum).forEach((subject) => {
    subjectGrades[subject] = {grades: []}
  })

  const studentGrades: {
    subject: string
    student: string
    grade: number
    sessionId?: string
  }[] = []

  let courseId: string | undefined = undefined
  let overallAverage: number | undefined = undefined

  // 3. Collecter les notes de l'étudiant
  if (hasGrades) {
    recordsGradeCollection.forEach((grade) => {
      if (!courseId) {
        courseId = grade.course?.id
      }

      const studentRecord = grade.records.find(
        (r: GradeRecord) => r.student.toString() === studentId,
      )

      if (studentRecord && !studentRecord.isAbsent && !grade.isDraft) {
        // Find the specific session using sessionId
        const matchingSession = grade.course?.sessions.find(
          (session: any) => session._id.toString() === grade.sessionId,
        )

        const subject = matchingSession?.subject || 'Unknown'

        studentGrades.push({
          sessionId: grade.sessionId,
          student: studentId,
          grade: studentRecord.value,
          subject: subject,
        })

        // Populate subject grades
        if (subjectGrades[subject as SubjectNameEnum]) {
          subjectGrades[subject as SubjectNameEnum]?.grades.push(studentRecord.value)
        }
      }
    })

    // Calculate average for each subject
    Object.keys(subjectGrades).forEach((subject) => {
      const subjectData = subjectGrades[subject as SubjectNameEnum]
      if (subjectData && subjectData.grades.length > 0) {
        subjectData.average =
          subjectData.grades.reduce((a, b) => a + b, 0) / subjectData.grades.length
      } else {
        // Remove subjects with no grades
        delete subjectGrades[subject as SubjectNameEnum]
      }
    })

    // Calculate general average
    if (studentGrades.length > 0) {
      overallAverage = studentGrades.reduce((sum, g) => sum + g.grade, 0) / studentGrades.length
    }

    // 4. Préparer le retour
    return {
      studentId,
      hasGrades,
      courseId,
      totalGradeRecords: recordsGradeCollection.length,
      grades: {
        details: studentGrades,
        bySubject: subjectGrades,
        overallAverage: overallAverage,
      },
    }
  }

  return null
}
