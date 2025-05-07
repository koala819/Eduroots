'use client'

import React, {ChangeEvent, useState} from 'react'
import ExcelJS from 'exceljs'
import {TimeSlotEnum} from '@/types/course'

// Définition des interfaces TypeScript
interface ProcessedData {
  lastName: string // Colonne A
  firstName: string // Colonne B
  teacher: string // Colonne C
  level: string // Colonne D
  classRoomNumber: string // Colonne E
  dayOfWeek: TimeSlotEnum // Colonne F
  startTime: string // Colonne G
  endTime: string // Colonne H
  gender: string // Colonne I
  dateOfBirth: string // Colonne J
  email: string // Colonne K
  phone: string // Colonne L
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
    const processedData: ProcessedData[] = []

    const toUpper = (str: string) =>
      str
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toUpperCase()
    const capitalizeWords = (str: string) =>
      str
        .split(/[- ]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(str.includes('-') ? '-' : ' ')

    data.forEach((row) => {
      let lastName = row['A'] ? String(row['A']).trim() : ''
      let firstName = row['B'] ? String(row['B']).trim() : ''
      lastName = toUpper(lastName)
      firstName = capitalizeWords(firstName)

      // Ignorer les lignes d'en-tête ou vides
      if (
        !lastName ||
        !firstName ||
        lastName === 'NOM' ||
        firstName === 'PRÉNOM' ||
        row['F'] === 'Jour de créneau' ||
        row['G'] === 'Heure de début' ||
        row['H'] === 'Heure de fin'
      ) {
        return
      }

      // Professeur, niveau, salle
      const teacher = row['C'] ? String(row['C']).trim() : ''
      const level = row['D'] ? String(row['D']).trim() : ''
      const classRoomNumber = row['E'] ? String(row['E']).trim() : ''

      // Jour de créneau (TimeSlotEnum)
      const dayOfWeek =
        row['F'] && Object.values(TimeSlotEnum).includes(String(row['F']).trim() as TimeSlotEnum)
          ? (String(row['F']).trim() as TimeSlotEnum)
          : undefined

      // Heure de début et de fin
      const startTime = row['G'] ? String(row['G']).trim() : ''
      const endTime = row['H'] ? String(row['H']).trim() : ''

      // Genre
      let gender = ''
      if (row['I']) {
        const genderValue = String(row['I']).trim().toUpperCase()
        if (genderValue === 'F' || genderValue === 'FEMININ' || genderValue === 'FÉMININ') {
          gender = 'female'
        } else if (genderValue === 'M' || genderValue === 'MASCULIN') {
          gender = 'male'
        } else {
          gender = genderValue
        }
      }

      // Date de naissance (colonne J)
      let dateOfBirth = ''
      if (row['J']) {
        const dateValue = row['J']
        if (dateValue instanceof Date) {
          dateOfBirth = dateValue.toISOString().split('T')[0]
        } else if (typeof dateValue === 'string') {
          const dateParts = dateValue.split(/[\/.\-]/)
          if (dateParts.length === 3) {
            const day = dateParts[0].padStart(2, '0')
            const month = dateParts[1].padStart(2, '0')
            const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]
            dateOfBirth = `${year}-${month}-${day}`
          }
        }
      }

      // Email (colonne K)
      const email = row['K'] ? String(row['K']).trim() : ''
      // Téléphone (colonne L)
      let phone = ''
      if (row['L']) {
        const phoneStr = String(row['L'])
        const phoneNumber = phoneStr.split(/[\/;,]/)[0].trim()
        phone = phoneNumber.replace(/[^\d]/g, '')
      }

      // Créer l'objet de données traitées
      const processedItem: ProcessedData = {
        lastName,
        firstName,
        teacher,
        level,
        classRoomNumber,
        dayOfWeek: dayOfWeek as TimeSlotEnum,
        startTime,
        endTime,
        gender,
        dateOfBirth,
        email,
        phone,
      }

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
      const workbook = new ExcelJS.Workbook()
      const buffer = await file.arrayBuffer()
      await workbook.xlsx.load(buffer)

      // Obtenir la première feuille
      const worksheet = workbook.worksheets[0]

      // Convertir en JSON
      const jsonData: ExcelRow[] = []
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Ignorer l'en-tête

        const rowData: ExcelRow = {}
        row.eachCell((cell, colNumber) => {
          const columnLetter = String.fromCharCode(64 + colNumber) // Convertir le numéro de colonne en lettre (A, B, C, etc.)
          rowData[columnLetter] = cell.value
        })
        jsonData.push(rowData)
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
      setResult({error: 'Erreur lors du traitement du fichier Excel'})
    }

    setLoading(false)
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
        <label className="block text-gray-700 mb-2">Sélectionnez votre fichier Excel:</label>
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
          Le fichier Excel doit contenir les données dans les colonnes suivantes:
        </p>
        <ul className="text-sm text-gray-600 list-disc ml-6">
          <li>Colonne A : Nom (en majuscules, ex : DUPONT)</li>
          <li>
            Colonne B : Prénom (première lettre de chaque partie en majuscule, ex : Anne-Laure)
          </li>
          <li>Colonne C : Professeur</li>
          <li>Colonne D : Niveau</li>
          <li>Colonne E : Salle</li>
          <li>
            Colonne F : Jour de créneau (saturday_morning, saturday_afternoon, sunday_morning)
          </li>
          <li>Colonne G : Heure de début (ex : 09:00)</li>
          <li>Colonne H : Heure de fin (ex : 10:45)</li>
          <li>Colonne I : Genre (F, M, Féminin, Masculin)</li>
          <li>Colonne J : Date de naissance (format JJ/MM/AAAA)</li>
          <li>Colonne K : Email</li>
          <li>Colonne L : Téléphone</li>
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
              Résultat JSON ({result.nonEmptyCount} enregistrements utiles sur {result.recordCount}{' '}
              lignes)
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
              Le fichier JSON généré est au format requis pour la comparaison avec votre base de
              données. Les noms complets ont été séparés en prénom et nom, et toutes les données
              sont formatées selon les exigences de votre système.
            </p>
          </div>
        </div>
      )}

      {result && result.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">{result.error}</div>
      )}
    </div>
  )
}

export default ExcelConverter
