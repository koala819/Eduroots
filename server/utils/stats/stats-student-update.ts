import fs from 'fs/promises'
import path from 'path'

import { getSessionServer } from '@/server/utils/server-helpers'
import {
  calculateStudentAttendanceRate,
  calculateStudentBehaviorRate,
  calculateStudentGrade,
} from '@/server/utils/stats/student'
import { SubjectNameEnum } from '@/types/courses'
import { StatsStudent } from '@/types/db'
import {
  InsertStudentStatsPayload,
  StudentStats,
  UpdateStats,
  UpdateStudentStatsPayload,
} from '@/types/stats-payload'

/**
 * Récupère tous les étudiants actifs
 */
async function fetchActiveStudents() {
  const { supabase } = await getSessionServer()
  const { data: students, error: studentsError } = await supabase
    .from('users')
    .select('id, firstname, lastname')
    .eq('role', 'student')
    .eq('is_active', true)

  if (studentsError) {
    throw new Error(`Erreur lors de la récupération des étudiants: ${studentsError.message}`)
  }

  return students || []
}

/**
 * Construit les statistiques d'un étudiant
 */
async function buildStudentStats(studentId: string) {
  const attendanceData = await calculateStudentAttendanceRate(studentId)
  const behaviorData = await calculateStudentBehaviorRate(studentId)
  const gradeData = await calculateStudentGrade(studentId)

  if (!attendanceData && !behaviorData) {
    return null
  }

  return {
    userId: studentId,
    absencesRate: attendanceData?.absencesRate ?? 0,
    absencesCount: attendanceData?.absencesCount ?? 0,
    absences: attendanceData?.absences || [],
    behaviorAverage: behaviorData?.behaviorAverage ?? 0,
    grades: {
      [SubjectNameEnum.Arabe]: {
        average: gradeData?.grades?.bySubject[SubjectNameEnum.Arabe]?.average ?? 0,
      },
      [SubjectNameEnum.EducationCulturelle]: {
        average: gradeData?.grades?.bySubject[SubjectNameEnum.EducationCulturelle]?.average ?? 0,
      },
      overallAverage: gradeData?.grades?.overallAverage ?? 0,
    },
    lastActivity: behaviorData?.lastActivity ? new Date(behaviorData.lastActivity) : null,
    lastUpdate: new Date(),
  }
}

/**
 * Met à jour les statistiques d'un étudiant dans la base de données
 */
async function updateStudentStatsInDb(
  studentId: string,
  studentStats: StudentStats,
  existingStats: StatsStudent | null,
) {
  const { supabase } = await getSessionServer()

  if (existingStats) {
    const updatePayload: UpdateStudentStatsPayload = {
      absences_rate: studentStats.absencesRate,
      absences_count: studentStats.absencesCount,
      behavior_average: studentStats.behaviorAverage,
      last_activity: studentStats.lastActivity || null,
      last_update: new Date(),
    }

    const { error: updateError } = await supabase
      .schema('stats')
      .from('student_stats')
      .update(updatePayload)
      .eq('user_id', studentId)

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }
  } else {
    const insertPayload: InsertStudentStatsPayload = {
      user_id: studentId,
      absences_rate: studentStats.absencesRate,
      absences_count: studentStats.absencesCount,
      behavior_average: studentStats.behaviorAverage,
      last_activity: studentStats.lastActivity || null,
      last_update: new Date(),
    }

    const { data: newStats, error: insertError } = await supabase
      .schema('stats')
      .from('student_stats')
      .insert([insertPayload])
      .select()
      .single()

    if (insertError) {
      throw new Error(`Erreur lors de la création: ${insertError.message}`)
    }

    if (newStats) {
      await safeUpdateUserStats(studentId, newStats.id)
    }
  }
}

/**
 * Génère un rapport de mise à jour
 */
async function generateUpdateReport(stats: UpdateStats): Promise<string | null> {
  try {
    const reportData = {
      date: new Date().toISOString(),
      stats,
    }

    const reportDir = path.join(process.cwd(), 'reports')
    await fs.mkdir(reportDir, { recursive: true })
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `student_stats_update_${timestamp}.json`
    const reportPath = path.join(reportDir, fileName)

    await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))
    return reportPath
  } catch (error: any) {
    console.log(`ℹ️ Impossible de générer le rapport: ${error.message}`)
    console.log('C\'est normal si vous exécutez ce script sur Vercel.')
    return null
  }
}

/**
 * Affiche le résumé de la mise à jour
 */
function displayUpdateSummary(stats: UpdateStats) {
  console.log('\n===== RÉSUMÉ DE LA MISE À JOUR =====')
  console.log(`- Total des étudiants: ${stats.totalStudents}`)
  console.log(
    `- Étudiants mis à jour: ${stats.updatedStudents}
    (${((stats.updatedStudents / stats.totalStudents) * 100 || 0).toFixed(1)}%)`,
  )
  console.log(`- Étudiants ignorés: ${stats.skippedStudents}`)
  console.log(`- Étudiants sans données: ${stats.studentsWithoutData}`)
  console.log(`- Changements de statistiques: ${stats.statsChanges.length}`)
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
    console.log('✅ Connecté à la base de données')
    console.log(
      '\n===== DÉBUT DE LA MISE À JOUR DES STATISTIQUES DES ÉTUDIANTS =====\n',
    )

    // Récupérer tous les étudiants actifs
    console.log('1️⃣ Récupération des étudiants...')
    const students = await fetchActiveStudents()
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
      const studentId = student.id
      const studentName = `${student.firstname} ${student.lastname}`
      console.log(`- Traitement de l'étudiant ${studentName} (${studentId})...`)

      try {
        const studentStats = await buildStudentStats(studentId)
        if (!studentStats) {
          console.log('  ⚠️ Étudiant sans données, ignoré')
          stats.studentsWithoutData++
          stats.skippedStudents++
          continue
        }

        const { supabase } = await getSessionServer()
        const { data: existingStats, error: statsError } = await supabase
          .schema('stats')
          .from('student_stats')
          .select('*')
          .eq('user_id', studentId)
          .single()

        if (statsError && statsError.code !== 'PGRST116') {
          throw new Error(`Erreur lors de la récupération des stats: ${statsError.message}`)
        }

        const oldStats = existingStats ? mapDbStatsToStudentStats(existingStats) : {}
        const differences = compareStudentStats(oldStats, studentStats)

        if (differences.length > 0) {
          await updateStudentStatsInDb(studentId, studentStats, existingStats)

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
          console.log('  ℹ️ Aucun changement nécessaire')
        }
      } catch (error: any) {
        console.error(
          `  ❌ Erreur lors du traitement de l'étudiant ${studentId}:`,
          error,
        )
        stats.skippedStudents++
      }
    }

    // Générer le rapport
    console.log('\n3️⃣ Génération du rapport...')
    const reportPath = await generateUpdateReport(stats)

    // Afficher le résumé
    displayUpdateSummary(stats)

    console.log(
      '\n✅ MISE À JOUR RÉUSSIE: Statistiques des étudiants recalculées avec succès',
    )
    console.log('\n===== FIN DE LA MISE À JOUR =====')

    return {
      success: true,
      message: `Mise à jour réussie: ${stats.updatedStudents}
      étudiants mis à jour sur ${stats.totalStudents}`,
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
 * Convertit les statistiques de la base de données en format StudentStats
 */
function mapDbStatsToStudentStats(dbStats: StatsStudent): Partial<StudentStats> {
  return {
    userId: dbStats.user_id,
    absencesRate: dbStats.absences_rate,
    absencesCount: dbStats.absences_count,
    behaviorAverage: dbStats.behavior_average,
    lastActivity: dbStats.last_activity ? new Date(dbStats.last_activity) : null,
    lastUpdate: new Date(dbStats.last_update),
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
  if (Math.abs((oldStats.absencesRate ?? 0) - newStats.absencesRate) > 0.01) {
    differences.push(
      `taux de présence: ${oldStats.absencesRate?.toFixed(2) ?? '0'}
      → ${newStats.absencesRate.toFixed(2)}%`,
    )
  }

  // Vérifier le nombre total d'absences
  if ((oldStats.absencesCount ?? 0) !== newStats.absencesCount) {
    differences.push(
      `absences totales: ${oldStats.absencesCount ?? 0} → ${newStats.absencesCount}`,
    )
  }

  // Vérifier la moyenne de comportement
  if (
    Math.abs((oldStats.behaviorAverage ?? 0) - newStats.behaviorAverage) > 0.01
  ) {
    differences.push(
      `comportement: ${oldStats.behaviorAverage?.toFixed(2) ?? '0'}
      → ${newStats.behaviorAverage.toFixed(2)}`,
    )
  }

  // Vérifier la dernière activité
  const oldLastActivity = oldStats.lastActivity
    ? new Date(oldStats.lastActivity).toISOString()
    : null
  const newLastActivity = newStats.lastActivity
    ? new Date(newStats.lastActivity).toISOString()
    : null

  if (oldLastActivity !== newLastActivity) {
    differences.push(
      `dernière activité: ${oldLastActivity ?? 'jamais'} → ${newLastActivity ?? 'jamais'}`,
    )
  }

  return differences
}

/**
 * Mise à jour sécurisée avec création du champ stats si nécessaire
 */
async function safeUpdateUserStats(studentId: string, statsId: string) {
  try {
    const { supabase } = await getSessionServer()

    // Tentative de mise à jour directe
    const { data: updateResult, error: updateError } = await supabase
      .from('users')
      .update({
        student_stats_id: statsId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', studentId)
      .select()

    if (updateError) {
      throw new Error(`Erreur lors de la mise à jour: ${updateError.message}`)
    }

    console.log('Mise à jour réussie:', {
      userId: updateResult?.[0]?.id,
      statsId: updateResult?.[0]?.student_stats_id,
    })

    // Vérification finale
    const { data: finalUser, error: finalError } = await supabase
      .from('users')
      .select('id, student_stats_id')
      .eq('id', studentId)
      .single()

    if (finalError) {
      throw new Error(`Erreur lors de la vérification finale: ${finalError.message}`)
    }

    console.log('Vérification finale:', {
      userId: finalUser?.id,
      statsId: finalUser?.student_stats_id,
      statsMatch: finalUser?.student_stats_id === statsId,
    })
  } catch (error: any) {
    console.error('Erreur lors de la mise à jour des stats utilisateur:', error)
    console.error('Détails de l\'erreur:', {
      name: error.name,
      message: error.message,
      stack: error.stack,
    })
  }
}
