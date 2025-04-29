// formatAttendanceCorrection.js
const fs = require('fs')
const path = require('path')

/**
 * Convertit un fichier de corrections d'attendances en un script MongoDB bulkWrite
 *
 * Usage:
 *   node formatAttendanceCorrection.js inputFile.js outputFile.js
 *
 * Par défaut, si aucun argument n'est fourni:
 *   - Cherche attendance_corrections.js dans le dossier courant
 *   - Crée attendance_corrections_bulk.js dans le dossier courant
 */

// Récupérer les arguments en ligne de commande
const inputFile = process.argv[2] || 'attendance_corrections.js'
const outputFile = process.argv[3] || 'attendance_corrections_bulk.js'

// Vérifier si le fichier d'entrée existe
if (!fs.existsSync(inputFile)) {
  console.error(`Erreur: Le fichier ${inputFile} n'existe pas.`)
  console.log('Usage: node formatAttendanceCorrection.js [inputFile.js] [outputFile.js]')
  process.exit(1)
}

// Lire le contenu du fichier
console.log(`Lecture du fichier ${inputFile}...`)
const content = fs.readFileSync(inputFile, 'utf8')

// Extraire les commandes updateOne
console.log('Extraction des commandes updateOne...')
const updatePattern =
  /db\.attendances\.updateOne\(\s*{\s*_id:\s*ObjectId\(['"]([^'"]+)['"]\)\s*},\s*{\s*\$set:\s*{\s*course:\s*ObjectId\(['"]([^'"]+)['"]\)\s*}\s*}\s*\);/g

let match
const operations = []
let count = 0

while ((match = updatePattern.exec(content)) !== null) {
  count++
  const attendanceId = match[1]
  const courseId = match[2]

  operations.push(`  {
    updateOne: {
      filter: { _id: ObjectId("${attendanceId}") },
      update: { $set: { course: ObjectId("${courseId}") } }
    }
  }`)
}

if (operations.length === 0) {
  console.error('Aucune commande updateOne trouvée dans le fichier.')
  process.exit(1)
}

// Générer le contenu du nouveau fichier
const output = `// Script de correction des attendances optimisé pour MongoDB
// Généré automatiquement le ${new Date().toISOString()}
// Ce script utilise bulkWrite pour une exécution plus efficace

// Exécuter toutes les corrections en une seule opération (${operations.length} mises à jour)
db.attendancenews.bulkWrite([
${operations.join(',\n')}
], { ordered: false });

// Fin du script
`

// Écrire le fichier de sortie
console.log(`Écriture du fichier ${outputFile}...`)
fs.writeFileSync(outputFile, output)

console.log(`Conversion terminée avec succès!`)
console.log(`- ${count} opérations de mise à jour extraites`)
console.log(`- Script optimisé écrit dans ${outputFile}`)
console.log('\nPour exécuter ce script dans MongoDB, vous pouvez:')
console.log('1. Ouvrir MongoDB Compass')
console.log('2. Sélectionner votre base de données')
console.log('3. CLiquer sur le bouton Open MongoDB shell"')
console.log('4. Copier-coller le contenu du script (CTRL +C)')
console.log('5. Appuyez sur ENTREE')
