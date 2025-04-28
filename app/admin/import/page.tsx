'use client'

import React, { ChangeEvent, useState } from 'react'

import * as XLSX from 'xlsx'

// Définition des interfaces TypeScript
interface ProcessedData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email: string
  phone: string
  teacher: string // Colonne C
  level: string // Colonne D
  classRoomNumber: string // Colonne E
  dayOfWeek: string // Colonne F
}

interface ResultData {
  data?: ProcessedData[]
  formatted?: string
  error?: string
  recordCount?: number
  nonEmptyCount?: number
}

interface ExcelRow {
  [key: string]: any
}

const ExcelConverter: React.FC = () => {
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Fonction pour vérifier si un objet est vide (toutes les valeurs sont des chaînes vides)
  const isEmptyObject = (obj: ProcessedData): boolean => {
    return Object.values(obj).every((value) => value === '')
  }

  // Fonction pour traiter les données Excel
  const processExcelData = (data: ExcelRow[]): ProcessedData[] => {
    // Tableau pour stocker les données traitées
    const processedData: ProcessedData[] = []

    // Traiter chaque ligne
    data.forEach((row) => {
      // Vérifier si nous avons au moins un nom complet
      const fullName = row['B'] || ''

      if (!fullName) return // Ignorer les lignes sans nom

      // Ignorer les lignes d'en-tête ou d'instruction (comme "Élève", "GENRE", "EMAIL", etc.)
      if (
        fullName === 'Élève' ||
        row['G'] === 'GENRE' ||
        row['J'] === 'EMAIL' ||
        row['C'] === 'Enseignant' ||
        row['D'] === 'Niveau' ||
        row['E'] === 'Salle' ||
        row['F'] === 'Créneau'
      ) {
        return
      }

      // Extraire le nom et le prénom
      let lastName = ''
      let firstName = ''

      // Séparation nom/prénom (le nom est généralement en majuscules, suivi du prénom)
      const nameParts = fullName.trim().split(' ')

      if (nameParts.length >= 2) {
        // Chercher le dernier mot en majuscules qui sert de séparateur
        let lastIndex = 0

        for (let i = 0; i < nameParts.length; i++) {
          if (
            nameParts[i] === nameParts[i].toUpperCase() &&
            nameParts[i].length > 1
          ) {
            lastIndex = i
          } else {
            break // Premier mot qui n'est pas en majuscules
          }
        }

        lastName = nameParts.slice(0, lastIndex + 1).join(' ')
        firstName = nameParts.slice(lastIndex + 1).join(' ')
      } else {
        // S'il n'y a qu'un seul mot, on le considère comme le nom de famille
        lastName = fullName
      }

      // Extraire et formater la date de naissance (colonne I)
      let dateOfBirth = ''
      if (row['I']) {
        // Vérifier si c'est une date Excel (numérique)
        let dateValue = row['I']

        if (typeof dateValue === 'number') {
          // Convertir la date Excel en date JavaScript
          const excelDate = XLSX.SSF.parse_date_code(dateValue)
          if (excelDate) {
            dateOfBirth = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`
          }
        } else if (typeof dateValue === 'string') {
          // Format probable: JJ/MM/AAAA
          const dateParts = dateValue.split(/[\/.-]/)
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0')
            const month = dateParts[1].padStart(2, '0')
            const year =
              dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]
            dateOfBirth = `${year}-${month}-${day}`
          }
        } else if (dateValue instanceof Date) {
          // Si c'est déjà un objet Date
          dateOfBirth = dateValue.toISOString().split('T')[0]
        }
      }

      // Extraire le genre (colonne G)
      let gender = ''
      if (row['G']) {
        const genderValue = String(row['G']).trim().toUpperCase()
        if (
          genderValue === 'F' ||
          genderValue === 'FEMININ' ||
          genderValue === 'FÉMININ'
        ) {
          gender = 'female'
        } else if (genderValue === 'M' || genderValue === 'MASCULIN') {
          gender = 'male'
        } else {
          gender = genderValue
        }
      }

      // Extraire l'email (colonne J)
      const email = row['J'] || ''

      // Extraire le téléphone (colonne M)
      let phone = ''
      if (row['M']) {
        const phoneStr = String(row['M'])
        // Prendre uniquement le premier numéro s'il y en a plusieurs
        const phoneNumber = phoneStr.split(/[\/;,]/)[0].trim()
        // Nettoyer le numéro (garder uniquement les chiffres)
        phone = phoneNumber.replace(/[^\d]/g, '')
      }

      // Nouvelles colonnes demandées
      // Extraire le professeur (colonne C)
      const teacher = row['C'] ? String(row['C']).trim() : ''

      // Extraire le niveau (colonne D)
      const level = row['D'] ? String(row['D']).trim() : ''

      // Extraire le numéro de classe (colonne E)
      const classRoomNumber = row['E'] ? String(row['E']).trim() : ''

      // Extraire le jour de la semaine (colonne F)
      const dayOfWeek = row['F'] ? String(row['F']).trim() : ''

      // Créer l'objet de données traitées
      const processedItem: ProcessedData = {
        firstName,
        lastName,
        dateOfBirth,
        gender,
        email,
        phone,
        teacher,
        level,
        classRoomNumber,
        dayOfWeek,
      }

      // Ajouter au tableau uniquement si au moins un champ n'est pas vide
      if (!isEmptyObject(processedItem) && (firstName || lastName)) {
        processedData.push(processedItem)
      }
    })

    return processedData
  }

  // Gérer le téléchargement du fichier
  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    setLoading(true)

    try {
      // Lire le fichier
      const reader = new FileReader()

      reader.onload = (e: ProgressEvent<FileReader>) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer)
          const workbook = XLSX.read(data, {
            type: 'array',
            cellDates: true,
            cellFormula: true,
            cellNF: true,
            raw: false,
          })

          // Obtenir la première feuille
          const sheetName = workbook.SheetNames[0]
          const sheet = workbook.Sheets[sheetName]

          // Convertir en JSON en utilisant 'A' comme en-tête (comme dans votre fonction compareStudentsWithExcel)
          const jsonData = XLSX.utils.sheet_to_json<ExcelRow>(sheet, {
            header: 'A',
            defval: null,
            raw: false,
            blankrows: false,
          })

          console.log('Données brutes Excel:', jsonData)

          // Traiter les données
          const processedData = processExcelData(jsonData)

          // Compter les enregistrements non vides
          const nonEmptyCount = processedData.length

          // Convertir au format JSON
          const formatted = JSON.stringify(processedData, null, 2)

          setResult({
            data: processedData,
            formatted,
            recordCount: jsonData.length,
            nonEmptyCount,
          })
        } catch (error) {
          console.error('Erreur lors du traitement du fichier:', error)
          setResult({ error: 'Erreur lors du traitement du fichier Excel' })
        }

        setLoading(false)
      }

      reader.onerror = () => {
        setResult({ error: 'Erreur lors de la lecture du fichier' })
        setLoading(false)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erreur:', error)
      setResult({ error: "Une erreur s'est produite" })
      setLoading(false)
    }
  }

  // Télécharger le résultat
  const downloadResult = () => {
    if (!result || !result.formatted) return

    const blob = new Blob([result.formatted], {
      type: 'application/json',
    })

    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `données_pour_comparaison.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url) // Libérer la mémoire
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-4 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-4">
        Convertisseur Excel vers JSON pour Base de Données
      </h1>

      <div className="mb-4 space-y-2">
        <label className="block text-gray-700 mb-2">
          Sélectionnez votre fichier Excel:
        </label>
        <input
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500
                   file:mr-4 file:py-2 file:px-4
                   file:rounded-md file:border-0
                   file:text-sm file:font-semibold
                   file:bg-blue-50 file:text-blue-700
                   hover:file:bg-blue-100"
        />
        <p className="text-sm text-gray-600">
          Le fichier Excel doit contenir les données dans les colonnes
          suivantes:
        </p>
        <ul className="text-sm text-gray-600 list-disc ml-6">
          <li>Colonne B: Nom complet (généralement NOM Prénom)</li>
          <li>Colonne C: Professeur</li>
          <li>Colonne D: Niveau</li>
          <li>Colonne E: Numéro de classe</li>
          <li>Colonne F: Jour de la semaine</li>
          <li>Colonne G: Genre (F, M, Féminin, Masculin)</li>
          <li>Colonne I: Date de naissance (format JJ/MM/AAAA)</li>
          <li>Colonne J: Email</li>
          <li>Colonne M: Téléphone</li>
        </ul>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p>Traitement en cours...</p>
        </div>
      )}

      {result && !result.error && result.data && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h2 className="text-xl font-semibold">
              Résultat JSON ({result.nonEmptyCount} enregistrements utiles sur{' '}
              {result.recordCount} lignes)
            </h2>
            <button
              onClick={downloadResult}
              className="py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Télécharger JSON
            </button>
          </div>

          <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border">
            <pre className="text-sm">{result.formatted}</pre>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-600">
              Le fichier JSON généré est au format requis pour la comparaison
              avec votre base de données. Les noms complets ont été séparés en
              prénom et nom, et toutes les données sont formatées selon les
              exigences de votre système.
            </p>
          </div>
        </div>
      )}

      {result && result.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">
          {result.error}
        </div>
      )}
    </div>
  )
}

export default ExcelConverter
