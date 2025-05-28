import {SubjectNameEnum} from '@/types/course'

import dbConnect from '@/backend/config/dbConnect'
import {Attendance} from '@/backend/models/attendance.model'
import {Course} from '@/backend/models/course.model'
import {User} from '@/backend/models/user.model'
import fs from 'fs/promises'
import path from 'path'
import {Types} from 'mongoose'

interface MorningCourseStats {
  arabe_9_10_45: number
  educationCulturelle_10_45_12_30: number
  educationCulturelle_9_10_45: number
  arabe_10_45_12_30: number
  teachers: Map<string, TeacherCourseDetail[]>
}

interface TeacherCourseDetail {
  teacherId: string
  teacherName?: string
  courseId: string
  dayOfWeek: string
  startTime: string
  endTime: string
  subject: string
  students: number
}

export async function checkAttendances(): Promise<{
  success: boolean
  message: string
  backupPath: string | null
  data: any
  morningCoursesStats?: MorningCourseStats
}> {
  try {
    await dbConnect()
    console.log('\n===== DÉBUT DE LA VÉRIFICATION DES ATTENDANCES =====\n')

    // Partie 1: Vérification des attendances
    const verificationResult = await verifyAttendanceSessions()

    // Partie 2: Si des sessions invalides sont trouvées, proposer des corrections
    let repairData = null
    let correctionScriptPath = null

    if (verificationResult.invalid > 0) {
      console.log(
        '\n⚙️ Des sessions invalides ont été détectées, analyse des corrections possibles...\n',
      )
      repairData = await analyzeAndSuggestRepairs(verificationResult.invalidAttendances as any)

      // Générer le fichier de correction si nous avons des correspondances à haute confiance
      if (repairData && repairData.highConfidence && repairData.highConfidence.length > 0) {
        correctionScriptPath = await generateCorrectionScriptFile(repairData.highConfidence)
      }
    }

    // Partie 3: Analyse des cours du matin pour maintenir la compatibilité avec la signature
    const morningCoursesStats = await analyzeMorningCourses()

    console.log('\n===== FIN DE LA VÉRIFICATION =====')

    return {
      success: true,
      message: repairData
        ? `Vérification terminée: ${verificationResult.valid} valides, ${verificationResult.invalid} invalides. ${repairData.highConfidence.length} peuvent être corrigées automatiquement.${correctionScriptPath ? ` Script de correction généré: ${correctionScriptPath}` : ''}`
        : `Vérification terminée: ${verificationResult.valid} valides, ${verificationResult.invalid} invalides.`,
      backupPath: correctionScriptPath,
      morningCoursesStats,
      data: {
        verification: verificationResult,
        repair: repairData,
        correctionScriptPath,
      },
    }
  } catch (error: any) {
    console.error('❌ Erreur lors de la vérification:', error)
    return {
      success: false,
      message: `Erreur lors de la vérification: ${error.message}`,
      backupPath: null,
      data: {
        error: error.message,
      },
    }
  }
}

/**
 * Vérifie si les sessions référencées dans les attendances existent
 */
async function verifyAttendanceSessions() {
  // Récupérer toutes les attendances actuelles
  const attendances = await Attendance.find().lean()
  const totalAttendances = attendances.length
  console.log(`📝 Nombre d'attendances trouvées: ${totalAttendances}`)

  if (totalAttendances === 0) {
    console.log('⚠️ Aucune attendance trouvée dans la collection')
    return {
      total: 0,
      valid: 0,
      invalid: 0,
      invalidAttendances: [],
    }
  }

  // Collecter tous les IDs de session uniques
  const uniqueSessionIds = new Set(attendances.map((attendance) => attendance.course.toString()))
  console.log(`🔢 Nombre de sessions uniques référencées: ${uniqueSessionIds.size}`)

  // Vérifier l'existence de chaque session dans les courses
  console.log('🔍 Vérification des références de session dans les courses...')
  const sessionStatus = await Promise.all(
    Array.from(uniqueSessionIds).map(async (sessionId) => {
      const course = await Course.findOne({'sessions._id': sessionId}).lean()

      return {
        sessionId,
        found: !!course,
        courseId: course?._id.toString() || null,
      }
    }),
  )

  // Séparer les sessions trouvées et manquantes
  const foundSessions = sessionStatus.filter((s) => s.found)
  const missingSessions = sessionStatus.filter((s) => !s.found)

  // Créer un mapping pour une recherche efficace
  const sessionMap = new Map(sessionStatus.map((session) => [session.sessionId, session.found]))

  // Identifier les attendances avec des sessions invalides
  const invalidAttendances = []
  let validCount = 0

  for (const attendance of attendances) {
    const attendanceId = attendance._id.toString()
    const sessionId = attendance.course.toString()

    if (sessionMap.get(sessionId)) {
      validCount++
    } else {
      invalidAttendances.push({
        _id: attendance._id,
        attendanceId,
        sessionId,
        date: attendance.date,
        records: attendance.records,
      })

      // Afficher l'erreur
      console.log(
        `❌ ERREUR: Attendance ${attendanceId} référence une session inexistante: ${sessionId}`,
      )
    }
  }

  // Afficher le résumé
  console.log('\n===== RÉSUMÉ DE LA VÉRIFICATION =====')
  console.log(`Total des attendances vérifiées: ${totalAttendances}`)
  console.log(
    `Références valides: ${validCount} (${((validCount / totalAttendances) * 100).toFixed(1)}%)`,
  )
  console.log(
    `Références invalides: ${invalidAttendances.length} (${((invalidAttendances.length / totalAttendances) * 100).toFixed(1)}%)`,
  )

  console.log(
    `\nSessions uniques trouvées: ${foundSessions.length}/${uniqueSessionIds.size} (${((foundSessions.length / uniqueSessionIds.size) * 100).toFixed(1)}%)`,
  )
  console.log(
    `Sessions uniques manquantes: ${missingSessions.length}/${uniqueSessionIds.size} (${((missingSessions.length / uniqueSessionIds.size) * 100).toFixed(1)}%)`,
  )

  if (invalidAttendances.length > 0) {
    console.log('\n===== DÉTAILS DES ERREURS =====')
    console.log('Attendances avec références de session invalides:')

    // Limiter l'affichage si trop d'erreurs
    const displayLimit = 20
    const displayCount = Math.min(invalidAttendances.length, displayLimit)

    for (let i = 0; i < displayCount; i++) {
      const detail = invalidAttendances[i]
      console.log(
        `${i + 1}. Attendance ID: ${detail.attendanceId}, Session ID invalide: ${detail.sessionId}, Date: ${detail.date}`,
      )
    }

    if (invalidAttendances.length > displayLimit) {
      console.log(`... et ${invalidAttendances.length - displayLimit} autres erreurs`)
    }
  }

  return {
    total: totalAttendances,
    valid: validCount,
    invalid: invalidAttendances.length,
    invalidAttendances,
    sessions: {
      total: uniqueSessionIds.size,
      found: foundSessions.length,
      missing: missingSessions.length,
      missingIds: missingSessions.map((s) => s.sessionId),
    },
  }
}

/**
 * Analyse les attendances invalides et suggère des corrections intelligentes
 */
async function analyzeAndSuggestRepairs(
  invalidAttendances: {
    attendanceId: string
    sessionId: string
    date: string
    records: Array<{
      student: string | {toString(): string}
    }>
  }[],
) {
  console.log(
    '\n🔬 Analyse des attendances avec sessions invalides pour proposer des corrections...',
  )

  // Récupérer toutes les sessions valides
  const validCourses = await Course.find().lean()
  const teachersData = await User.find({role: 'teacher'}).lean()

  // Créer un map des enseignants pour un accès rapide
  const teachersMap = new Map()
  teachersData.forEach((teacher) => {
    teachersMap.set((teacher as any)._id.toString(), {
      id: (teacher as any)._id.toString(),
      name: `${(teacher as any).firstname} ${(teacher as any).lastname}`,
    })
  })

  // Collecter des informations détaillées sur chaque attendance invalide
  const attendanceData = []

  for (const invalidAttendance of invalidAttendances) {
    // Récupérer les IDs des étudiants
    const studentIds = invalidAttendance.records.map((record) =>
      typeof record.student === 'string' ? record.student : record.student.toString(),
    )

    // Trouver les cours qui contiennent ces étudiants
    const studentCoursesMap = new Map() // studentId -> [sessionIds]

    for (const course of validCourses) {
      const teacherIds = Array.isArray(course.teacher)
        ? course.teacher.map((t: any) => (typeof t === 'object' ? t._id.toString() : t.toString()))
        : [
            typeof course.teacher === 'object' && course.teacher !== null && '_id' in course.teacher
              ? (course.teacher as {_id: Types.ObjectId})._id.toString()
              : (course.teacher as Types.ObjectId | string).toString(),
          ]

      // Récupérer les noms des enseignants
      const teacherNames = teacherIds.map((id: string) => {
        const teacher = teachersMap.get(id)
        return teacher ? teacher.name : `Enseignant (${id})`
      })

      for (const session of course.sessions) {
        const sessionStudentIds = session.students.map((sid: any) =>
          typeof sid === 'string' ? sid : sid.toString(),
        )

        // Calculer les étudiants communs avec cette attendance
        const commonStudents = studentIds.filter((id) => sessionStudentIds.includes(id))
        const matchRatio = studentIds.length > 0 ? commonStudents.length / studentIds.length : 0

        // Ajouter seulement les sessions avec au moins un étudiant en commun
        if (commonStudents.length > 0) {
          for (const studentId of commonStudents) {
            if (!studentCoursesMap.has(studentId)) {
              studentCoursesMap.set(studentId, [])
            }

            studentCoursesMap.get(studentId).push({
              courseId: course._id.toString(),
              sessionId: (session._id as any).toString(),
              teacherId: teacherIds[0],
              teacherNames: teacherNames,
              subject: session.subject,
              weekday: session.timeSlot.dayOfWeek,
              startTime: session.timeSlot.startTime,
              endTime: session.timeSlot.endTime,
              time: `${session.timeSlot.startTime}-${session.timeSlot.endTime}`,
              matchRatio,
              commonStudentsCount: commonStudents.length,
              totalStudents: studentIds.length,
            })
          }
        }
      }
    }

    // Calculer les sessions les plus fréquentes pour ces étudiants
    const sessionFrequency = new Map() // sessionId -> { count, details }

    studentCoursesMap.forEach((sessions: any) => {
      sessions.forEach((session: any) => {
        const key = session.sessionId
        if (!sessionFrequency.has(key)) {
          sessionFrequency.set(key, {
            count: 0,
            details: session,
          })
        }
        sessionFrequency.get(key).count += 1
      })
    })

    // Trouver la session la plus fréquente
    let mostFrequentSessionId = null
    let highestFrequency = 0
    let bestSessionDetails = null

    sessionFrequency.forEach((data, sessionId) => {
      if (data.count > highestFrequency) {
        highestFrequency = data.count
        mostFrequentSessionId = sessionId
        bestSessionDetails = data.details
      }
    })

    if (bestSessionDetails) {
      attendanceData.push({
        attendanceId: invalidAttendance.attendanceId,
        originalSessionId: invalidAttendance.sessionId,

        date: invalidAttendance.date,
        studentCount: studentIds.length,
        potentialSessionMatch: {
          ...(bestSessionDetails as object),
          matchRatio: highestFrequency / studentIds.length,
        },
        matchRatio: highestFrequency / studentIds.length,
      })
    }
  }

  // Trier les attendances par ratio de correspondance décroissant
  attendanceData.sort((a, b) => b.matchRatio - a.matchRatio)

  // Diviser en groupes selon le niveau de confiance
  const highConfidenceMatches = attendanceData.filter((data) => data.matchRatio >= 0.7)
  const mediumConfidenceMatches = attendanceData.filter(
    (data) => data.matchRatio >= 0.4 && data.matchRatio < 0.7,
  )
  const lowConfidenceMatches = attendanceData.filter((data) => data.matchRatio < 0.4)

  console.log('\n🔄 Statistiques des correspondances:')
  console.log(`- Correspondances à haute confiance (≥70%): ${highConfidenceMatches.length}`)
  console.log(`- Correspondances à confiance moyenne (40-70%): ${mediumConfidenceMatches.length}`)
  console.log(`- Correspondances à faible confiance (<40%): ${lowConfidenceMatches.length}`)

  // Afficher les exemples de corrections proposées
  if (highConfidenceMatches.length > 0) {
    console.log('\n📝 Exemples de corrections proposées (top 10):')

    const topCorrections = highConfidenceMatches.slice(0, 10)
    for (let i = 0; i < topCorrections.length; i++) {
      const correction = topCorrections[i]
      console.log(`${i + 1}. Attendance ID: ${correction.attendanceId}`)
      console.log(`   Session originale: ${correction.originalSessionId}`)
      console.log(`   Session proposée: ${(correction.potentialSessionMatch as any).sessionId}`)
      console.log(
        `   Enseignant(s): ${(correction.potentialSessionMatch as any).teacherNames.join(', ')}`,
      )
      console.log(`   Sujet: ${(correction.potentialSessionMatch as any).subject}`)
      console.log(
        `   Jour/Heure: ${(correction.potentialSessionMatch as any).weekday} ${(correction.potentialSessionMatch as any).time}`,
      )
      console.log(
        `   Étudiants en commun: ${(correction.potentialSessionMatch as any).commonStudentsCount}/${(correction.potentialSessionMatch as any).totalStudents}`,
      )
      console.log(`   Taux de correspondance: ${(correction.matchRatio * 100).toFixed(1)}%\n`)
    }

    console.log(
      '\n🛠️ Un script de correction peut être généré pour les correspondances à haute confiance.',
    )
  }

  return {
    analyzed: attendanceData.length,
    highConfidence: highConfidenceMatches,
    mediumConfidence: mediumConfidenceMatches,
    lowConfidence: lowConfidenceMatches,
  }
}

/**
 * Génère un fichier avec le script de correction MongoDB
 */
async function generateCorrectionScriptFile(highConfidenceMatches: any[]) {
  try {
    // Créer le contenu du script
    let scriptContent = `// Script de correction des attendances avec sessions invalides\n`
    scriptContent += `// Généré le ${new Date().toISOString()}\n`
    scriptContent += `// Ce script peut être exécuté dans MongoDB Compass ou via mongo shell\n\n`

    // Ajouter chaque commande de mise à jour
    for (const match of highConfidenceMatches) {
      if (match.potentialSessionMatch && match.potentialSessionMatch.sessionId) {
        scriptContent += `// Attendance du ${new Date(match.date).toLocaleDateString()} - ${match.potentialSessionMatch.subject}\n`
        scriptContent += `// Jour/Heure: ${match.potentialSessionMatch.weekday} ${match.potentialSessionMatch.time}\n`
        scriptContent += `// Enseignant(s): ${match.potentialSessionMatch.teacherNames.join(', ')}\n`
        scriptContent += `// Correspondance: ${(match.matchRatio * 100).toFixed(1)}% (${match.potentialSessionMatch.commonStudentsCount}/${match.potentialSessionMatch.totalStudents} étudiants)\n`
        scriptContent += `db.attendances.updateOne(\n`
        scriptContent += `  { _id: ObjectId("${match.attendanceId}") },\n`
        scriptContent += `  { $set: { course: ObjectId("${match.potentialSessionMatch.sessionId}") } }\n`
        scriptContent += `);\n\n`
      }
    }

    // Déterminer le chemin du fichier
    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0]
    const fileName = `attendance_corrections_${timestamp}.js`

    // Assurer que le répertoire de scripts existe
    const scriptsDir = path.join(process.cwd(), 'scripts')
    await fs.mkdir(scriptsDir, {recursive: true})

    const filePath = path.join(scriptsDir, fileName)

    // Écrire le fichier
    await fs.writeFile(filePath, scriptContent, 'utf8')

    console.log(`✅ Script de correction généré: ${filePath}`)

    return filePath
  } catch (error) {
    console.error(`❌ Erreur lors de la génération du script de correction:`, error)
    return null
  }
}

/**
 * Analyse des cours du matin (conservé pour la compatibilité avec la signature)
 */
async function analyzeMorningCourses() {
  console.log('\n🔍 Analyse des cours du matin...')

  const stats = {
    arabe_9_10_45: 0,
    educationCulturelle_10_45_12_30: 0,
    educationCulturelle_9_10_45: 0,
    arabe_10_45_12_30: 0,
    teachers: new Map(),
  }

  // Récupérer tous les cours actifs
  const courses = await Course.find({
    isActive: true,
    deletedAt: null,
  }).lean()

  console.log(`📚 Total des cours actifs: ${courses.length}`)

  // Récupérer tous les professeurs dans un Map pour un accès rapide
  const teachersData = await User.find({
    role: 'teacher',
    isActive: true,
  }).lean()

  const teachersMap = new Map()
  teachersData.forEach((teacher) => {
    teachersMap.set((teacher as any)._id.toString(), {
      firstname: teacher.firstname || '',
      lastname: teacher.lastname || '',
    })
  })

  let morningSessionCount = 0

  // Analyser chaque cours
  for (const course of courses) {
    const teacherIds = Array.isArray(course.teacher)
      ? course.teacher.map((t: any) => (typeof t === 'object' ? t._id.toString() : t.toString()))
      : [
          typeof course.teacher === 'object' && course.teacher !== null && '_id' in course.teacher
            ? (course.teacher as {_id: Types.ObjectId})._id.toString()
            : (course.teacher as Types.ObjectId | string).toString(),
        ]

    // Analyser les sessions du matin (9h-12h30)
    const morningSessions = course.sessions.filter((session: any) => {
      return (
        (session.timeSlot.startTime === '09:00' &&
          (session.timeSlot.endTime === '10:45' || session.timeSlot.endTime === '12:30')) ||
        (session.timeSlot.startTime === '10:45' && session.timeSlot.endTime === '12:30')
      )
    })

    morningSessionCount += morningSessions.length

    // Classifier les sessions selon leur créneau et matière
    for (const session of morningSessions) {
      // Compter les types de cours
      if (session.subject === SubjectNameEnum.Arabe) {
        if (session.timeSlot.startTime === '09:00' && session.timeSlot.endTime === '10:45') {
          stats.arabe_9_10_45++
        } else if (session.timeSlot.startTime === '10:45' && session.timeSlot.endTime === '12:30') {
          stats.arabe_10_45_12_30++
        }
      } else if (session.subject === SubjectNameEnum.EducationCulturelle) {
        if (session.timeSlot.startTime === '09:00' && session.timeSlot.endTime === '10:45') {
          stats.educationCulturelle_9_10_45++
        } else if (session.timeSlot.startTime === '10:45' && session.timeSlot.endTime === '12:30') {
          stats.educationCulturelle_10_45_12_30++
        }
      }

      // Ajouter la session à chaque enseignant du cours
      for (const teacherId of teacherIds) {
        if (!stats.teachers.has(teacherId)) {
          stats.teachers.set(teacherId, [])
        }

        // Récupérer les informations du professeur depuis le Map
        const teacher = teachersMap.get(teacherId)
        const teacherName = teacher
          ? `${teacher.firstname} ${teacher.lastname}`
          : 'Professeur inconnu'

        stats.teachers.get(teacherId).push({
          teacherId,
          teacherName,
          courseId: course._id.toString(),
          dayOfWeek: session.timeSlot.dayOfWeek,
          startTime: session.timeSlot.startTime,
          endTime: session.timeSlot.endTime,
          subject: session.subject,
          students: session.students.length,
        })
      }
    }
  }

  console.log(`Total des sessions du matin trouvées: ${morningSessionCount}`)

  return stats
}
