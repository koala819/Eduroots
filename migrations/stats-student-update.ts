import { SubjectNameEnum } from '@/types/course'
import { StudentStats } from '@/types/stats'

import dbConnect from '@/backend/config/dbConnect'
import { StudentStats as StudentStatsCollection } from '@/backend/models/student-stats.model'
import { User } from '@/backend/models/user.model'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/lib/stats/student'
import { convertToDate } from '@/lib/utils'
import fs from 'fs/promises'
import { ObjectId } from 'mongoose'
import path from 'path'

interface UpdateStats {
  totalStudents: number
  updatedStudents: number
  skippedStudents: number
  studentsWithoutData: number
  statsChanges: Array<{
    studentId: string
    studentName: string
    oldStats: any
    newStats: StudentStats
    differences: string[]
  }>
}

/**
 * Calcule et met à jour les statistiques de tous les étudiants
 */
export async function statsStudentUpdate(): Promise<{
  success: boolean
  message: string
  stats?: UpdateStats
  backupPath: string | null
}> {
  try {
    // Connexion à la base de données
    await dbConnect()
    console.log('✅ Connecté à la base de données')
    console.log(
      `\n===== DÉBUT DE LA MISE À JOUR DES STATISTIQUES DES ÉTUDIANTS =====\n`,
    )

    // Récupérer tous les étudiants actifs
    console.log('1️⃣ Récupération des étudiants...')
    const students = await User.find({ role: 'student', isActive: true })
    console.log(`- Total des étudiants trouvés: ${students.length}`)

    // Initialiser les statistiques
    const stats: UpdateStats = {
      totalStudents: students.length,
      updatedStudents: 0,
      skippedStudents: 0,
      studentsWithoutData: 0,
      statsChanges: [],
    }

    // Traiter chaque étudiant
    console.log('\n2️⃣ Mise à jour des statistiques...')

    for (const student of students) {
      const studentId = student._id.toString()
      const studentName = `${student.firstname} ${student.lastname}`
      console.log(`- Traitement de l'étudiant ${studentName} (${studentId})...`)

      try {
        // Récupérer les données d'assiduité
        const attendanceData = await calculateStudentAttendanceRate(studentId)

        // Récupérer les données de comportement
        const behaviorData = await calculateStudentBehaviorRate(studentId)

        // Récupérer les notes
        const gradeData = await calculateStudentGrade(studentId)

        // Vérifier si l'étudiant a des données
        if (!attendanceData && !behaviorData) {
          console.log(`  ⚠️ Étudiant sans données, ignoré`)
          stats.studentsWithoutData++
          stats.skippedStudents++
          continue
        }

        // Construire les statistiques de l'étudiant selon l'interface StudentStats
        const studentStats: StudentStats = {
          userId: studentId,
          absencesRate: attendanceData?.attendanceRate || 0,
          absencesCount: attendanceData?.absencesCount || 0,
          absences: attendanceData?.absences || [],
          behaviorAverage: behaviorData?.behaviorAverage || 0,
          grades: {
            [SubjectNameEnum.Arabe]: {
              average:
                gradeData?.grades?.bySubject[SubjectNameEnum.Arabe]?.average ||
                0,
            },
            [SubjectNameEnum.EducationCulturelle]: {
              average:
                gradeData?.grades?.bySubject[
                  SubjectNameEnum.EducationCulturelle
                ]?.average || 0,
            },
            overallAverage: gradeData?.grades?.overallAverage || 0,
          },
          lastActivity: behaviorData?.lastActivity || null,
          lastUpdate: new Date(),
        }

        // Trouver ou créer l'entrée de statistiques pour cet étudiant
        let statsDoc = await StudentStatsCollection.findOne({
          userId: studentId,
        }).lean()

        // Déterminer les anciennes stats pour comparaison
        const oldStats = statsDoc || {}

        // Vérifier si les stats ont changé
        const differences = compareStudentStats(oldStats, studentStats)

        if (differences.length > 0) {
          // Mise à jour du document existant
          if (statsDoc) {
            await StudentStatsCollection.updateOne(
              { _id: (statsDoc as any)._id },
              {
                $set: {
                  ...studentStats,
                  lastUpdate: new Date(),
                },
              },
            )
          }
          // Création car aucun document existant
          else {
            const newStatsDoc = new StudentStatsCollection({
              // userId: studentId,
              ...studentStats,
              lastUpdate: new Date(),
            })

            await newStatsDoc.save()

            if (newStatsDoc) {
              await safeUpdateUserStats(studentId, newStatsDoc._id)
            }
          }

          stats.statsChanges.push({
            studentId,
            studentName,
            oldStats,
            newStats: studentStats,
            differences,
          })

          stats.updatedStudents++
          console.log(
            `  ✅ Statistiques mises à jour: ${differences.join(', ')}`,
          )
        } else {
          stats.skippedStudents++
          console.log(`  ℹ️ Aucun changement nécessaire`)
        }
      } catch (error) {
        console.error(
          `  ❌ Erreur lors du traitement de l'étudiant ${studentId}:`,
          error,
        )
        stats.skippedStudents++
      }
    }

    // 3. Essayer de générer un rapport (fonctionne en local, pas sur Vercel)
    let reportPath = null
    try {
      console.log('\n3️⃣ Génération du rapport...')

      const reportData = {
        date: new Date().toISOString(),
        stats,
      }

      const reportDir = path.join(process.cwd(), 'reports')
      await fs.mkdir(reportDir, { recursive: true })
      const timestamp = new Date().toISOString().replace(/:/g, '-')
      const fileName = `student_stats_update_${timestamp}.json`
      reportPath = path.join(reportDir, fileName)

      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))
      console.log(`✅ Rapport généré: ${reportPath}`)
    } catch (error: any) {
      console.log(`ℹ️ Impossible de générer le rapport: ${error.message}`)
      console.log("C'est normal si vous exécutez ce script sur Vercel.")
    }

    // 4. Afficher le résumé
    console.log('\n===== RÉSUMÉ DE LA MISE À JOUR =====')
    console.log(`- Total des étudiants: ${stats.totalStudents}`)
    console.log(
      `- Étudiants mis à jour: ${stats.updatedStudents} (${((stats.updatedStudents / stats.totalStudents) * 100 || 0).toFixed(1)}%)`,
    )
    console.log(`- Étudiants ignorés: ${stats.skippedStudents}`)
    console.log(`- Étudiants sans données: ${stats.studentsWithoutData}`)
    console.log(`- Changements de statistiques: ${stats.statsChanges.length}`)

    console.log(
      '\n✅ MISE À JOUR RÉUSSIE: Statistiques des étudiants recalculées avec succès',
    )

    console.log(`\n===== FIN DE LA MISE À JOUR =====`)

    return {
      success: true,
      message: `Mise à jour réussie: ${stats.updatedStudents} étudiants mis à jour sur ${stats.totalStudents}`,
      stats,
      backupPath: reportPath,
    }
  } catch (error: any) {
    console.error('❌ Erreur fatale lors de la mise à jour:', error)

    return {
      success: false,
      message: `Erreur lors de la mise à jour: ${error.message}`,
      backupPath: null,
    }
  }
}

/**
 * Compare les anciennes et nouvelles statistiques d'un étudiant
 */
function compareStudentStats(
  oldStats: Partial<StudentStats>,
  newStats: StudentStats,
): string[] {
  const differences = []

  // Vérifier le taux de présence
  if (Math.abs((oldStats.absencesRate || 0) - newStats.absencesRate) > 0.01) {
    differences.push(
      `taux de présence: ${oldStats.absencesRate?.toFixed(2) || '0'} → ${newStats.absencesRate.toFixed(2)}%`,
    )
  }

  // Vérifier le nombre total d'absences
  if ((oldStats.absencesCount || 0) !== newStats.absencesCount) {
    differences.push(
      `absences totales: ${oldStats.absencesCount || 0} → ${newStats.absencesCount}`,
    )
  }

  // Vérifier la moyenne de comportement
  if (
    Math.abs((oldStats.behaviorAverage || 0) - newStats.behaviorAverage) > 0.01
  ) {
    differences.push(
      `comportement: ${oldStats.behaviorAverage?.toFixed(2) || '0'} → ${newStats.behaviorAverage.toFixed(2)}`,
    )
  }

  // Vérifier la dernière présence
  const oldLastAttendance = oldStats.lastActivity
    ? convertToDate(oldStats.lastActivity).toISOString()
    : null
  const newLastAttendance = newStats.lastActivity
    ? convertToDate(newStats.lastActivity).toISOString()
    : null

  if (oldLastAttendance !== newLastAttendance) {
    differences.push(
      `dernière présence: ${oldLastAttendance || 'jamais'} → ${newLastAttendance || 'jamais'}`,
    )
  }

  // Vérifier le dernier comportement
  const oldLastBehavior = oldStats.lastActivity
    ? convertToDate(oldStats.lastActivity).toISOString()
    : null
  const newLastBehavior = newStats.lastActivity
    ? convertToDate(newStats.lastActivity).toISOString()
    : null

  if (oldLastBehavior !== newLastBehavior) {
    differences.push(
      `dernier comportement: ${oldLastBehavior || 'jamais'} → ${newLastBehavior || 'jamais'}`,
    )
  }

  return differences
}

/**
 * Mise à jour sécurisée avec création du champ stats si nécessaire
 */
async function safeUpdateUserStats(studentId: string, statsDocId: ObjectId) {
  try {
    // Tentative de mise à jour directe
    const updateResult = await User.updateOne(
      { _id: studentId },
      {
        $set: {
          stats: statsDocId,
          updatedAt: new Date(), // Mettre à jour le timestamp
        },
      },
      {
        upsert: false, // Ne pas créer un nouveau document
        runValidators: true,
      },
    )

    console.log('Direct update result:', {
      matchedCount: updateResult.matchedCount,
      modifiedCount: updateResult.modifiedCount,
    })

    // Si aucune mise à jour n'a eu lieu, essayer une méthode alternative
    if (updateResult.modifiedCount === 0) {
      // Récupérer le document et mettre à jour manuellement
      const user = await User.findById(studentId)

      if (user) {
        // Vérifier si le champ stats existe déjà
        if (!user.stats) {
          console.log(
            `Ajout du champ stats pour ${user.firstname} ${user.lastname}`,
          )

          // Ajouter explicitement le champ stats
          user.stats = statsDocId

          // Sauvegarder avec des options supplémentaires
          const savedUser = await user.save({
            validateBeforeSave: true,
            timestamps: true,
          })

          console.log('Mise à jour manuelle réussie:', {
            userId: savedUser._id,
            stats: savedUser.stats,
          })
        } else {
          console.log(
            `Champ stats existe déjà pour ${user.firstname} ${user.lastname}`,
          )
        }
      } else {
        console.error(`Utilisateur non trouvé avec l'ID: ${studentId}`)
      }
    }

    // Vérification finale
    const finalUser = await User.findById(studentId)
    console.log('Vérification finale:', {
      userId: finalUser?._id,
      stats: finalUser?.stats,
      statsMatch: finalUser?.stats?.toString() === statsDocId.toString(),
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des stats utilisateur:', error)

    // Log détaillé de l'erreur
    console.error("Détails de l'erreur:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
  }
}
