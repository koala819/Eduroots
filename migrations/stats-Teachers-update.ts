import {TeacherStats} from '@/types/stats'
import {GenderEnum} from '@/types/user'

import dbConnect from '@/backend/config/dbConnect'
import {TeacherStats as TeacherStatsCollection} from '@/backend/models/teacher-stats.model'
import {User} from '@/backend/models/user.model'
import {calculateTeacherStats} from '@/lib/stats/teacher'
import fs from 'fs/promises'
import {ObjectId} from 'mongoose'
import path from 'path'

interface UpdateStats {
  totalTeachers: number
  updatedTeachers: number
  skippedTeachers: number
  teachersWithoutStudents: number
  statsChanges: Array<{
    teacherId: string
    teacherName: string
    oldStats: any
    newStats: TeacherStats
    differences: string[]
  }>
}

/**
 * Calcule et met à jour les statistiques de tous les professeurs
 */
export async function statsTeacherUpdate(): Promise<{
  success: boolean
  message: string
  stats?: UpdateStats
  backupPath: string | null
}> {
  try {
    // Connexion à la base de données
    await dbConnect()
    console.log('✅ Connecté à la base de données')
    console.log(`\n===== DÉBUT DE LA MISE À JOUR DES STATISTIQUES DES PROFESSEURS =====\n`)

    // Récupérer tous les professeurs actifs
    console.log('1️⃣ Récupération des professeurs...')
    const teachers = await User.find({role: 'teacher', isActive: true})
    console.log(`- Total des professeurs trouvés: ${teachers.length}`)

    // Initialiser les statistiques
    const stats: UpdateStats = {
      totalTeachers: teachers.length,
      updatedTeachers: 0,
      skippedTeachers: 0,
      teachersWithoutStudents: 0,
      statsChanges: [],
    }

    // Traiter chaque professeur
    console.log('\n2️⃣ Mise à jour des statistiques...')

    for (const teacher of teachers) {
      const teacherId = teacher._id.toString()
      const teacherName = `${teacher.firstname} ${teacher.lastname}`
      console.log(`- Traitement du professeur ${teacherName} (${teacherId})...`)

      try {
        // Récupérer les statistiques du professeur
        const teacherStats: TeacherStats = await calculateTeacherStats(teacherId)

        // Vérifier si le professeur a des étudiants
        if (teacherStats.totalStudents === 0) {
          console.log(`  ⚠️ Professeur sans étudiants, ignoré`)
          stats.teachersWithoutStudents++
          stats.skippedTeachers++
          continue
        }

        // Trouver ou créer l'entrée de statistiques pour ce professeur
        const statsDoc = await TeacherStatsCollection.findOne({
          userId: teacherId,
        }).lean()

        // Déterminer les anciennes stats pour comparaison
        const oldStats = statsDoc || {}

        // Vérifier si les stats ont changé
        const differences = compareTeacherStats(oldStats, teacherStats)

        if (differences.length > 0) {
          // Préparer les nouvelles statistiques au format du schéma
          const newTeacherStats = {
            totalStudents: teacherStats.totalStudents,
            genderDistribution: {
              counts: {
                [GenderEnum.Masculin]: teacherStats.genderDistribution.counts[GenderEnum.Masculin],
                [GenderEnum.Feminin]: teacherStats.genderDistribution.counts[GenderEnum.Feminin],
                undefined: teacherStats.genderDistribution.counts.undefined,
              },
              percentages: {
                [GenderEnum.Masculin]:
                  teacherStats.genderDistribution.percentages[GenderEnum.Masculin],
                [GenderEnum.Feminin]:
                  teacherStats.genderDistribution.percentages[GenderEnum.Feminin],
                undefined: teacherStats.genderDistribution.percentages.undefined,
              },
            },
            minAge: teacherStats.minAge,
            maxAge: teacherStats.maxAge,
            averageAge: teacherStats.averageAge,
          }

          // Mise à jour du document existant
          if (statsDoc) {
            await TeacherStatsCollection.updateOne(
              {_id: (statsDoc as any)._id},
              {
                $set: {
                  ...newTeacherStats,
                  lastUpdate: new Date(),
                },
              },
            )
          }
          // Création car aucun document existant
          else {
            const newStatsDoc = new TeacherStatsCollection({
              userId: teacherId,
              ...newTeacherStats,
              lastUpdate: new Date(),
            })

            await newStatsDoc.save()

            if (newStatsDoc) {
              await safeUpdateUserStats(teacherId, newStatsDoc._id)
            }
          }

          stats.statsChanges.push({
            teacherId,
            teacherName,
            oldStats,
            newStats: teacherStats,
            differences,
          })

          stats.updatedTeachers++
          console.log(`  ✅ Statistiques mises à jour: ${differences.join(', ')}`)
        } else {
          stats.skippedTeachers++
          console.log(`  ℹ️ Aucun changement nécessaire`)
        }
      } catch (error) {
        console.error(`  ❌ Erreur lors du traitement du professeur ${teacherId}:`, error)
        stats.skippedTeachers++
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
      await fs.mkdir(reportDir, {recursive: true})
      const timestamp = new Date().toISOString().replace(/:/g, '-')
      const fileName = `teacher_stats_update_${timestamp}.json`
      reportPath = path.join(reportDir, fileName)

      await fs.writeFile(reportPath, JSON.stringify(reportData, null, 2))
      console.log(`✅ Rapport généré: ${reportPath}`)
    } catch (error: any) {
      console.log(`ℹ️ Impossible de générer le rapport: ${error.message}`)
      console.log("C'est normal si vous exécutez ce script sur Vercel.")
    }

    // 4. Afficher le résumé
    console.log('\n===== RÉSUMÉ DE LA MISE À JOUR =====')
    console.log(`- Total des professeurs: ${stats.totalTeachers}`)
    console.log(
      `- Professeurs mis à jour: ${stats.updatedTeachers} (${((stats.updatedTeachers / stats.totalTeachers) * 100 || 0).toFixed(1)}%)`,
    )
    console.log(`- Professeurs ignorés: ${stats.skippedTeachers}`)
    console.log(`- Professeurs sans étudiants: ${stats.teachersWithoutStudents}`)
    console.log(`- Changements de statistiques: ${stats.statsChanges.length}`)

    console.log('\n✅ MISE À JOUR RÉUSSIE: Statistiques des professeurs recalculées avec succès')

    console.log(`\n===== FIN DE LA MISE À JOUR =====`)

    return {
      success: true,
      message: `Mise à jour réussie: ${stats.updatedTeachers} professeurs mis à jour sur ${stats.totalTeachers}`,
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
 * Compare les anciennes et nouvelles statistiques d'un professeur
 */
function compareTeacherStats(oldStats: Partial<TeacherStats>, newStats: TeacherStats): string[] {
  const differences = []

  // Vérifier le nombre total d'étudiants
  if (oldStats.totalStudents !== newStats.totalStudents) {
    differences.push(
      `nombre d'étudiants: ${oldStats.totalStudents || 0} → ${newStats.totalStudents}`,
    )
  }

  // Vérifier les statistiques d'âge
  if (Math.abs((oldStats.minAge || 0) - newStats.minAge) > 0.01) {
    differences.push(`âge minimum: ${oldStats.minAge || 0} → ${newStats.minAge}`)
  }

  if (Math.abs((oldStats.maxAge || 0) - newStats.maxAge) > 0.01) {
    differences.push(`âge maximum: ${oldStats.maxAge || 0} → ${newStats.maxAge}`)
  }

  if (Math.abs((oldStats.averageAge || 0) - newStats.averageAge) > 0.01) {
    differences.push(`âge moyen: ${oldStats.averageAge || 0} → ${newStats.averageAge}`)
  }

  // Vérifier la distribution des genres
  const oldDistribution: {[key in GenderEnum]?: string} =
    oldStats.genderDistribution?.percentages || {}
  const newDistribution = newStats.genderDistribution.percentages

  if (oldDistribution[GenderEnum.Masculin] !== newDistribution[GenderEnum.Masculin]) {
    differences.push(
      `pourcentage garçons: ${oldDistribution[GenderEnum.Masculin] || '0'} → ${newDistribution[GenderEnum.Masculin]}`,
    )
  }

  if (oldDistribution[GenderEnum.Feminin] !== newDistribution[GenderEnum.Feminin]) {
    differences.push(
      `pourcentage filles: ${oldDistribution[GenderEnum.Feminin] || '0'} → ${newDistribution[GenderEnum.Feminin]}`,
    )
  }

  return differences
}

// Mise à jour sécurisée avec création du champ stats si nécessaire
async function safeUpdateUserStats(teacherId: string, statsDocId: ObjectId) {
  try {
    // Tentative de mise à jour directe
    const updateResult = await User.updateOne(
      {_id: teacherId},
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
      const user = await User.findById(teacherId)

      if (user) {
        // Vérifier si le champ stats existe déjà
        if (!user.stats) {
          console.log(`Ajout du champ stats pour ${user.firstname} ${user.lastname}`)

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
          console.log(`Champ stats existe déjà pour ${user.firstname} ${user.lastname}`)
        }
      } else {
        console.error(`Utilisateur non trouvé avec l'ID: ${teacherId}`)
      }
    }

    // Vérification finale
    const finalUser = await User.findById(teacherId)
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
