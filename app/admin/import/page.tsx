'use client'

import React, { ChangeEvent, useState } from 'react'
import ExcelJS from 'exceljs'
import { TimeSlotEnum } from '@/types/course'

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

interface TeacherData {
  id: string // Colonne I
  lastName: string // Colonne J
  firstName: string // Colonne K
  email: string // Colonne L
  gender: string // Colonne M
  phone: string // Colonne N
}

// Fonction utilitaire pour extraire la valeur d'une cellule ExcelJS
const getCellString = (cell: any) => {
  if (!cell) return ''
  if (typeof cell === 'string') return cell.trim()
  if (typeof cell === 'object') {
    if ('text' in cell) return String(cell.text).trim()
    if ('hyperlink' in cell) return String(cell.hyperlink).replace('mailto:', '').trim()
  }
  return String(cell).trim()
}

const ExcelConverter: React.FC = () => {
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [teacherStepMessage, setTeacherStepMessage] = useState<string | null>(null)
  const [teachersFormatted, setTeachersFormatted] = useState<TeacherData[] | null>(null)

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

  const formatTeachersFromExcel = (data: ExcelRow[]): TeacherData[] => {
    const teachers: TeacherData[] = []
    const seen = new Set<string>() // Pour éviter les doublons sur l'id prof

    data.forEach((row) => {
      const id = getCellString(row['I'])
      if (!id || seen.has(id)) return // ignorer les doublons ou vides
      seen.add(id)

      const lastName = getCellString(row['J']).toUpperCase()
      const firstName = getCellString(row['K'])
      const email = getCellString(row['L'])
      let gender = ''
      if (row['M']) {
        const genderValue = getCellString(row['M']).toUpperCase()
        if (genderValue === 'F' || genderValue === 'FEMININ' || genderValue === 'FÉMININ') {
          gender = 'female'
        } else if (genderValue === 'M' || genderValue === 'MASCULIN') {
          gender = 'male'
        } else {
          gender = genderValue
        }
      }
      const phone = getCellString(row['N']).replace(/[^\d]/g, '')

      if (id && lastName && firstName) {
        teachers.push({ id, lastName, firstName, email, gender, phone })
      }
    })
    return teachers
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

      // Étape 1 : formatage des enseignants
      let teachers: TeacherData[] = []
      try {
        teachers = formatTeachersFromExcel(jsonData)
        setTeachersFormatted(teachers)
        setTeacherStepMessage(
          `Étape 1 : Intégration des enseignants avec succès (${teachers.length} enseignants formatés).`,
        )
      } catch (err: any) {
        setTeacherStepMessage("Erreur lors de l'intégration des enseignants : " + err.message)
        setTeachersFormatted(null)
      }

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
          Le fichier Excel doit contenir les données dans les colonnes suivantes :
        </p>
        <ul className="text-sm text-gray-600 list-disc ml-6">
          <li>
            <b>Colonne A à G (Élève) :</b>
          </li>
          <li>Colonne A : Nom de l&apos;élève</li>
          <li>Colonne B : Prénom de l&apos;élève</li>
          <li>Colonne C : ID Professeur référent</li>
          <li>Colonne D : Genre de l&apos;élève</li>
          <li>Colonne E : Date de naissance de l&apos;élève (JJ/MM/AAAA)</li>
          <li>Colonne F : Email de l&apos;élève</li>
          <li>Colonne G : Téléphone de l&apos;élève</li>
          <li className="mt-2">
            <b>Colonne I à N (Enseignant) :</b>
          </li>
          <li>Colonne I : ID Professeur</li>
          <li>Colonne J : Nom du professeur</li>
          <li>Colonne K : Prénom du professeur</li>
          <li>Colonne L : Email du professeur</li>
          <li>Colonne M : Genre du professeur</li>
          <li>Colonne N : Téléphone du professeur</li>
          <li className="mt-2">
            <b>Colonne O à R (Cours) :</b>
          </li>
          <li>Colonne O : Matière</li>
          <li>Colonne P : Jour de travail</li>
          <li>Colonne Q : Salle de classe</li>
          <li>Colonne R : Niveau</li>
        </ul>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p>Traitement en cours...</p>
        </div>
      )}

      {teacherStepMessage && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">{teacherStepMessage}</div>
      )}
      {teacherStepMessage && teachersFormatted && teachersFormatted.length > 0 && (
        <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border mt-2">
          <pre className="text-sm">{JSON.stringify(teachersFormatted, null, 2)}</pre>
        </div>
      )}

      {result && result.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">{result.error}</div>
      )}
    </div>
  )
}

export default ExcelConverter
