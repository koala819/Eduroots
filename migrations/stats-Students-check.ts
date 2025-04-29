import {User as UserCollection} from '@/backend/models/user.model'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/lib/stats/student'
import fs from 'fs/promises'
import path from 'path'

export async function statsStudentCheck(): Promise<{
  success: boolean
  message: string
  backupPath: string | null
}> {
  const studentId = '6712aa03194b28ce644703ed'
  // const studentId = '66a23f4e1bfe6a163d1ae7da'

  try {
    // Récupérer tous les students
    const students = await UserCollection.find({
      role: 'student',
    })
    console.log('📊 Rapport de validation des étudiants :')
    console.log('─'.repeat(80))
    const studentStats = await Promise.all(
      students.map(async (student) => {
        try {
          const attendanceData = await calculateStudentAttendanceRate(student.id)
          const behaviorData = await calculateStudentBehaviorRate(student.id)
          const gradeData = await calculateStudentGrade(student.id)

          return {
            student: {
              _id: student._id,
              firstName: student.firstname,
              lastName: student.lastname,
            },
            attendance: {
              totalSessions: attendanceData.totalSessions,
              absencesCount: attendanceData.absencesCount,
              attendanceRate: attendanceData.attendanceRate,
              lastActivity: attendanceData.lastActivity,
            },
            behavior: {
              average: behaviorData.behaviorAverage,
              lastActivity: behaviorData.lastActivity,
            },
            grades: {
              courseId: gradeData?.courseId,
              totalRecords: gradeData?.totalGradeRecords,
              gradeDetails: gradeData?.grades,
            },
          }
        } catch (error) {
          console.error(`Erreur pour l'étudiant ${student._id}:`, error)
          return null
        }
      }),
    )

    // Filtrer les résultats pour enlever les erreurs
    const validResults = studentStats.filter((result) => result !== null)

    // Préparer le rapport global
    const reportData = {
      date: new Date().toISOString(),
      totalStudents: students.length,
      studentsWithGrades: validResults.length,
      studentGrades: validResults,
    }

    // Générer et sauvegarder le rapport
    const reportDir = path.join(process.cwd(), 'reports')
    await fs.mkdir(reportDir, {recursive: true})

    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `Students_GRADES_stats_${timestamp}.json`
    const reportPath = path.join(reportDir, fileName)

    // Écrire le rapport de manière formatée
    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))
    console.log(`✅ Rapport de notes généré: ${reportPath}`)

    return {
      success: true,
      message: 'Analyse des notes des élèves terminée avec succès',
      backupPath: reportPath,
    }
  } catch (error) {
    console.error('Erreur lors de la génération du rapport de notes :', error)
    return {
      success: false,
      message: `Erreur lors de l'analyse des notes: ${error instanceof Error ? error.message : error}`,
      backupPath: null,
    }
  }
}
