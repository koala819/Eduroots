// @ts-nocheck
import { GradeDocument } from '@/types/mongoose'

import dbConnect from '@/backend/config/dbConnect'
import { Grade } from '@/backend/models/grade.model'
import fs from 'fs/promises'
import path from 'path'

interface UpdateStats {
  totalGrades: number
  updatedGrades: number
  skippedGrades: number
  gradesWithoutRecords: number
  statsChanges: Array<{
    gradeId: string
    oldStats: {
      averageGrade: number
      highestGrade: number
      lowestGrade: number
      absentCount: number
      totalStudents: number
    }
    newStats: {
      averageGrade: number
      highestGrade: number
      lowestGrade: number
      absentCount: number
      totalStudents: number
    }
    differences: string[]
  }>
}

/**
 * Calcule et met à jour les statistiques de tous les grades
 */
export async function statsGradesUpdate(): Promise<{
  success: boolean
  message: string
  stats: UpdateStats
  reportPath: string | null
  backupPath: string | null
}> {
  try {
    // Connexion à la base de données
    await dbConnect()
    console.log('✅ Connecté à la base de données')
    console.log(
      `\n===== DÉBUT DE LA MISE À JOUR DES STATISTIQUES DE GRADES =====\n`,
    )

    // Récupérer tous les grades
    console.log('1️⃣ Récupération des grades...')
    const grades = await Grade.find({}).lean()
    console.log(`- Total des grades trouvés: ${grades.length}`)

    // Initialiser les statistiques
    const stats: UpdateStats = {
      totalGrades: grades.length,
      updatedGrades: 0,
      skippedGrades: 0,
      gradesWithoutRecords: 0,
      statsChanges: [],
    }

    // Traiter chaque grade
    console.log('\n2️⃣ Mise à jour des statistiques...')

    for (const grade of grades) {
      const gradeId = grade._id.toString()
      console.log(`- Traitement du grade ${gradeId}...`)

      // Vérifier si le grade a des enregistrements
      if (!grade.records || grade.records.length === 0) {
        console.log(`  ⚠️ Grade sans enregistrements, ignoré`)
        stats.gradesWithoutRecords++
        stats.skippedGrades++
        continue
      }

      // Calculer les nouvelles statistiques
      const records = grade.records
      const totalStudents = records.length

      // Compter les absents
      const absentRecords = records.filter((r) => r.isAbsent)
      const absentCount = absentRecords.length

      // Filtrer les notes valides (non absents et avec une valeur)
      const validGrades = records
        .filter((r) => !r.isAbsent && r.value !== null && r.value !== undefined)
        .map((r) => r.value)

      // Si aucune note valide, définir des valeurs par défaut
      if (validGrades.length === 0) {
        console.log(
          `  ⚠️ Aucune note valide trouvée, valeurs par défaut utilisées`,
        )

        const newStats = {
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          absentCount,
          totalStudents,
        }

        // Vérifier si les stats ont changé
        const oldStats = grade.stats || {
          averageGrade: 0,
          highestGrade: 0,
          lowestGrade: 0,
          absentCount: 0,
          totalStudents: 0,
        }

        const differences = compareStats(oldStats, newStats)

        if (differences.length > 0) {
          // Mettre à jour le grade
          await Grade.updateOne(
            { _id: grade._id },
            { $set: { stats: newStats } },
          )

          stats.statsChanges.push({
            gradeId,
            oldStats,
            newStats,
            differences,
          })

          stats.updatedGrades++
          console.log(
            `  ✅ Statistiques mises à jour avec des valeurs par défaut`,
          )
        } else {
          stats.skippedGrades++
          console.log(`  ℹ️ Aucun changement nécessaire`)
        }

        continue
      }

      // Calculer les statistiques
      const averageGrade = Number(
        (
          validGrades.reduce((sum, val) => sum + val, 0) / validGrades.length
        ).toFixed(2),
      )
      const highestGrade = Math.max(...validGrades)
      const lowestGrade = Math.min(...validGrades)

      const newStats = {
        averageGrade,
        highestGrade,
        lowestGrade,
        absentCount,
        totalStudents,
      }

      // Vérifier si les stats ont changé
      const oldStats = grade.stats || {
        averageGrade: 0,
        highestGrade: 0,
        lowestGrade: 0,
        absentCount: 0,
        totalStudents: 0,
      }

      const differences = compareStats(oldStats, newStats)

      if (differences.length > 0) {
        // Mettre à jour le grade
        await Grade.updateOne({ _id: grade._id }, { $set: { stats: newStats } })

        stats.statsChanges.push({
          gradeId,
          oldStats,
          newStats,
          differences,
        })

        stats.updatedGrades++
        console.log(`  ✅ Statistiques mises à jour: ${differences.join(', ')}`)
      } else {
        stats.skippedGrades++
        console.log(`  ℹ️ Aucun changement nécessaire`)
      }
    }

    // 3. Générer un rapport
    console.log('\n3️⃣ Génération du rapport...')

    const reportData = {
      date: new Date().toISOString(),
      stats,
    }

    const reportPath = path.join(process.cwd(), 'reports')
    await fs.mkdir(reportPath, { recursive: true })
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `grade_stats_update_${timestamp}.json`
    const filePath = path.join(reportPath, fileName)

    await fs.writeFile(filePath, JSON.stringify(reportData, null, 2))
    console.log(`✅ Rapport généré: ${filePath}`)

    // 4. Afficher le résumé
    console.log('\n===== RÉSUMÉ DE LA MISE À JOUR =====')
    console.log(`- Total des grades: ${stats.totalGrades}`)
    console.log(
      `- Grades mis à jour: ${stats.updatedGrades} (${((stats.updatedGrades / stats.totalGrades) * 100).toFixed(1)}%)`,
    )
    console.log(`- Grades ignorés: ${stats.skippedGrades}`)
    console.log(`- Grades sans enregistrements: ${stats.gradesWithoutRecords}`)
    console.log(`- Changements de statistiques: ${stats.statsChanges.length}`)

    const isSuccessful = true // La mise à jour est toujours considérée comme réussie si elle s'exécute sans erreur

    if (isSuccessful) {
      console.log(
        '\n✅ MISE À JOUR RÉUSSIE: Statistiques recalculées avec succès',
      )
    }

    console.log(`\n===== FIN DE LA MISE À JOUR =====`)

    return {
      success: isSuccessful,
      message: isSuccessful
        ? `Mise à jour réussie: ${stats.updatedGrades} grades mis à jour sur ${stats.totalGrades}`
        : 'Erreur lors de la mise à jour des statistiques',
      stats,
      reportPath: filePath,
    }
  } catch (error) {
    console.error('❌ Erreur fatale lors de la mise à jour:', error)

    return {
      success: false,
      message: `Erreur lors de la mise à jour: ${error.message}`,
      stats: {
        totalGrades: 0,
        updatedGrades: 0,
        skippedGrades: 0,
        gradesWithoutRecords: 0,
        statsChanges: [],
      },
      reportPath: null,
    }
  }
}

/**
 * Compare deux objets de statistiques et renvoie un tableau des différences
 */
function compareStats(oldStats, newStats) {
  const differences = []

  // Créer un objet avec les descriptions des champs
  const fieldDescriptions = {
    averageGrade: 'moyenne',
    highestGrade: 'note maximale',
    lowestGrade: 'note minimale',
    absentCount: "nombre d'absents",
    totalStudents: "nombre total d'étudiants",
  }

  // Comparer chaque champ
  for (const [key, description] of Object.entries(fieldDescriptions)) {
    const oldValue = oldStats[key]
    const newValue = newStats[key]

    // Pour les valeurs numériques, utiliser une tolérance pour les erreurs d'arrondi
    if (typeof newValue === 'number' && typeof oldValue === 'number') {
      if (Math.abs(newValue - oldValue) > 0.01) {
        differences.push(
          `${description}: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)}`,
        )
      }
    } else if (newValue !== oldValue) {
      differences.push(`${description}: ${oldValue} → ${newValue}`)
    }
  }

  return differences
}

/**
 * Fonction principale pour exécuter le script
 */
export async function updateGradeStats(): Promise<void> {
  console.log('🔄 Démarrage de la mise à jour des statistiques des grades...')

  const result = await updateAllGradeStats()

  if (result.success) {
    console.log('✅ Mise à jour terminée avec succès')
  } else {
    console.error('❌ La mise à jour a échoué:', result.message)
  }

  console.log('📊 Statistiques de mise à jour:', result.stats)

  if (result.reportPath) {
    console.log('📝 Rapport disponible à:', result.reportPath)
  }
}
