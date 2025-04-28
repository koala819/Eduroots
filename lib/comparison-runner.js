import dbConnect from '@/backend/config/dbConnect'
import { User } from '@/backend/models/user.model'
import 'tsconfig-paths/register'

// comparison-all-in-one.js
const fs = require('fs')
const path = require('path')

// Définir les énumérations requises
const GenderEnum = {
  Masculin: 'masculin',
  Feminin: 'feminin',
}

const UserRoleEnum = {
  Student: 'student',
}

// Fonction principale
async function runComparison() {
  try {
    console.log('🔍 Démarrage de la comparaison des étudiants...')

    // Chemin vers le fichier JSON (dans le même répertoire)
    const jsonFilePath = path.join(__dirname, 'données_pour_comparaison.json')

    if (!fs.existsSync(jsonFilePath)) {
      console.error(`❌ Le fichier ${jsonFilePath} n'existe pas!`)
      return
    }
    await dbConnect()
    console.log(`📄 Lecture du fichier: ${jsonFilePath}`)
    const jsonContent = fs.readFileSync(jsonFilePath, 'utf8')
    const jsonStudents = JSON.parse(jsonContent)

    console.log(`📊 ${jsonStudents.length} étudiants dans le fichier JSON`)

    const dbStudents = await User.find({
      role: 'student',
      isActive: true,
    }).lean()

    console.log(`📊 ${dbStudents.length} étudiants dans la base de données`)

    // Comparer les listes
    const result = compareStudents(jsonStudents, dbStudents)

    // Générer le rapport
    const reportPath = generateReport(result)

    console.log(`📝 Rapport généré: ${reportPath}`)
    console.log(
      `✅ Terminé: ${result.matching.length} correspondants, ${result.toAdd.length} à ajouter, ${result.toRemove.length} à supprimer`,
    )
  } catch (error) {
    console.error('❌ Erreur:', error)
  }
}

// Fonction pour normaliser les noms (retirer accents, espaces, etc.)
function normalizeName(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '')
}

// Fonction de comparaison
function compareStudents(jsonStudents, dbStudents) {
  // Normaliser les noms pour la comparaison
  const createCompareKey = (first, last) => {
    return `${normalizeName(first || '')}-${normalizeName(last || '')}`
  }

  // Créer une Map des étudiants DB pour accès rapide
  const dbMap = new Map()
  dbStudents.forEach((student) => {
    const key = createCompareKey(student.firstname, student.lastname)
    dbMap.set(key, student)
  })

  // Faire la correspondance
  const matching = []
  const toAdd = []

  jsonStudents.forEach((jsonStudent) => {
    const key = createCompareKey(jsonStudent.firstName, jsonStudent.lastName)
    if (dbMap.has(key)) {
      matching.push({
        json: jsonStudent,
        db: dbMap.get(key),
      })
      dbMap.delete(key) // Marquer comme traité
    } else {
      toAdd.push(jsonStudent)
    }
  })

  // Les étudiants restants dans dbMap sont à supprimer
  const toRemove = Array.from(dbMap.values())

  return { matching, toAdd, toRemove }
}

// Générer le rapport en Markdown
function generateReport(result) {
  const timestamp = new Date().toISOString().replace(/[:\.]/g, '-')
  const reportDir = path.join(__dirname, 'reports')

  // Créer le répertoire si nécessaire
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true })
  }

  const reportFile = path.join(reportDir, `student_comparison_${timestamp}.md`)

  // Générer le contenu du rapport
  let report = `# Rapport de comparaison des étudiants\n\n`
  report += `Date: ${new Date().toLocaleString()}\n\n`

  // Résumé
  report += `## Résumé\n\n`
  report += `- Étudiants correspondants: ${result.matching.length}\n`
  report += `- Étudiants à ajouter: ${result.toAdd.length}\n`
  report += `- Étudiants à supprimer: ${result.toRemove.length}\n\n`

  // Étudiants correspondants
  report += `## Étudiants correspondants (${result.matching.length})\n\n`
  if (result.matching.length > 0) {
    report += `| ID | Nom | Prénom | Email |\n`
    report += `|---|-----|--------|-------|\n`

    result.matching.forEach(({ db }) => {
      report += `| ${db._id} | ${db.lastname} | ${db.firstname} | ${db.email} |\n`
    })
    report += `\n`
  } else {
    report += `*Aucun étudiant correspondant trouvé*\n\n`
  }

  // Étudiants à ajouter
  report += `## Étudiants à ajouter (${result.toAdd.length})\n\n`
  if (result.toAdd.length > 0) {
    report += `| Nom | Prénom | Email | Téléphone | Genre | Date de naissance |\n`
    report += `|-----|--------|-------|-----------|-------|------------------|\n`

    result.toAdd.forEach((student) => {
      report += `| ${student.lastName} | ${student.firstName} | ${student.email || ''} | ${student.phone || ''} | ${student.gender || ''} | ${student.dateOfBirth || ''} |\n`
    })
    report += `\n`
  } else {
    report += `*Aucun étudiant à ajouter*\n\n`
  }

  // Étudiants à supprimer
  report += `## Étudiants à supprimer (${result.toRemove.length})\n\n`
  if (result.toRemove.length > 0) {
    report += `| ID | Nom | Prénom | Email |\n`
    report += `|---|-----|--------|-------|\n`

    result.toRemove.forEach((student) => {
      report += `| ${student._id} | ${student.lastname} | ${student.firstname} | ${student.email} |\n`
    })
    report += `\n`
  } else {
    report += `*Aucun étudiant à supprimer*\n\n`
  }

  // Script MongoDB
  report += `## Script de migration MongoDB\n\n`
  report += '```javascript\n'

  // Script pour ajouter de nouveaux étudiants
  if (result.toAdd.length > 0) {
    report += `// 1. Ajouter les nouveaux étudiants\n`
    result.toAdd.forEach((student) => {
      const gender =
        student.gender === 'female'
          ? GenderEnum.Feminin
          : student.gender === 'male'
            ? GenderEnum.Masculin
            : null

      report += `db.userNEW.insertOne({\n`
      report += `  firstname: "${student.firstName}",\n`
      report += `  lastname: "${student.lastName}",\n`
      report += `  email: "${student.email || `${student.firstName.toLowerCase()}.${student.lastName.toLowerCase()}@example.com`}",\n`
      report += `  phone: ${student.phone ? `"${student.phone}"` : 'null'},\n`

      if (student.dateOfBirth) {
        report += `  dateOfBirth: new Date("${student.dateOfBirth}"),\n`
      } else {
        report += `  dateOfBirth: null,\n`
      }

      report += `  gender: ${gender ? `"${gender}"` : 'null'},\n`
      report += `  role: "${UserRoleEnum.Student}",\n`
      report += `  password: "$2a$10$randomHashedPassword", // Remplacer par un mot de passe hashé\n`

      if (student.level) {
        report += `  schoolYear: "${student.level}",\n`
      }

      report += `  isActive: true,\n`
      report += `  createdAt: new Date(),\n`
      report += `  updatedAt: new Date()\n`
      report += `});\n\n`
    })
  }

  // Script pour supprimer des étudiants (soft delete)
  if (result.toRemove.length > 0) {
    report += `// 2. Désactiver les étudiants à supprimer (soft delete)\n`
    result.toRemove.forEach((student) => {
      report += `db.userNEW.updateOne({ _id: ObjectId("${student._id}") }, { $set: { isActive: false, deletedAt: new Date() } });\n`
    })
  }

  report += '```\n'

  fs.writeFileSync(reportFile, report, 'utf8')
  return reportFile
}

// Exécuter la fonction principale
runComparison()
