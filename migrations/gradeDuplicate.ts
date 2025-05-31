import dbConnect from '@/backend/config/dbConnect'
import {Grade} from '@/backend/models/grade.model'
import fs from 'fs/promises'
import path from 'path'

interface MigrationStats {
  totalGrades: number
  duplicatesFound: number
  duplicatesRemoved: number
}

export async function checkGradesDuplicates(): Promise<{
  success: boolean
  message: string
  stats: MigrationStats
  backupPath: string | null
  data: any
}> {
  try {
    // Connexion à la base de données
    await dbConnect()

    // Récupérer tous les grades
    const grades = await Grade.find({})

    // Initialiser les statistiques
    const stats: MigrationStats = {
      totalGrades: grades.length,
      duplicatesFound: 0,
      duplicatesRemoved: 0,
    }

    // Groupe pour identifier les doublons
    const duplicateGroups: {[key: string]: typeof grades} = {}

    // Parcourir tous les grades
    grades.forEach((grade) => {
      const key = `${grade.sessionId}-${(grade.date as any).toISOString().split('T')[0]}`

      if (!duplicateGroups[key]) {
        duplicateGroups[key] = []
      }

      duplicateGroups[key].push(grade)
    })

    // Filtrer les groupes avec plus d'un grade
    const duplicates = Object.values(duplicateGroups).filter((group) => group.length > 1)

    // Mettre à jour les statistiques de doublons
    stats.duplicatesFound = duplicates.length

    // Données détaillées pour le retour
    const data = {
      duplicateGroups: duplicates.map((group) =>
        group.map((grade) => ({
          id: grade._id,
          sessionId: grade.sessionId,
          date: grade.date,
        })),
      ),
    }

    // Supprimer les doublons (en gardant le premier de chaque groupe)
    for (const group of duplicates) {
      const [toKeep, ...toRemove] = group

      for (const duplicateGrade of toRemove) {
        await Grade.deleteOne({_id: duplicateGrade._id})
        stats.duplicatesRemoved++
      }
    }

    // Générer un rapport
    const reportData = {
      date: new Date().toISOString(),
      stats,
      duplicateGroups: data.duplicateGroups,
    }

    // Créer le dossier de rapports si n'existe pas
    const reportPath = path.join(process.cwd(), 'reports')
    await fs.mkdir(reportPath, {recursive: true})

    // Nom de fichier avec timestamp
    const timestamp = new Date().toISOString().replace(/:/g, '-')
    const fileName = `grade_duplicates_check_${timestamp}.json`
    const filePath = path.join(reportPath, fileName)

    // Écrire le rapport
    await fs.writeFile(filePath, JSON.stringify(reportData, null, 2))

    return {
      success: stats.duplicatesFound > 0 ? true : false,
      message:
        stats.duplicatesFound > 0
          ? `${stats.duplicatesFound} doublons trouvés et ${stats.duplicatesRemoved} supprimés`
          : 'Aucun doublon trouvé',
      stats,
      backupPath: null,
      data,
    }
  } catch (error: any) {
    console.error('Erreur lors de la vérification des doublons :', error)

    return {
      success: false,
      message: `Erreur : ${error.message}`,
      stats: {
        totalGrades: 0,
        duplicatesFound: 0,
        duplicatesRemoved: 0,
      },
      backupPath: null,
      data: null,
    }
  }
}
