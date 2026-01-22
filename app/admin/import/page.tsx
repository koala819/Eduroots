'use client'

import ExcelJS from 'exceljs'
import React, { ChangeEvent, useState } from 'react'

import { LevelEnum, SubjectNameEnum, TimeSlotEnum } from '@/types/courses'
import { User } from '@/types/db'
import {
  CourseSessionDataType,
  ExcelRow as ExcelRowType,
  formatCoursesFromExcel,
  formatStudentsFromExcelWithWarnings,
  formatTeachersFromExcelWithWarnings,
  ProcessedData as ProcessedDataType,
  processExcelData,
} from '@/types/import'

const ACADEMIC_YEAR = '2024'

interface ResultData {
  data?: ProcessedDataType[]
  formatted?: string
  error?: string
  recordCount?: number
  nonEmptyCount?: number
}

const ExcelConverter: React.FC = () => {
  const [result, setResult] = useState<ResultData | null>(null)
  const [loading, setLoading] = useState<boolean>(false)
  const [teacherStepMessage, setTeacherStepMessage] = useState<string>('')
  const [teachersFormatted, setTeachersFormatted] = useState<User[] | null>(null)
  const [coursesFormatted, setCoursesFormatted] = useState<CourseSessionDataType[] | null>(null)
  const [courseStepMessage, setCourseStepMessage] = useState<string | null>(null)
  const [teacherWarnings, setTeacherWarnings] = useState<string[]>([])
  const [studentsFormatted, setStudentsFormatted] = useState<User[] | null>(null)
  const [studentStepMessage, setStudentStepMessage] = useState<string | null>(null)
  const [studentWarningsRed, setStudentWarningsRed] = useState<string[]>([])
  const [studentWarningsYellow, setStudentWarningsYellow] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{
    success: boolean
    message: string
    logs?: string[]
    error?: string
  } | null>(null)
  const [courseWarnings, setCourseWarnings] = useState<string[]>([])
  const [mergedTeachers, setMergedTeachers] = useState<Array<{
    originalId: string
    mergedId: string
    name: string
    subjects: string[]
  }>>([])
  const [studentCourses, setStudentCourses] = useState<Array<{
    studentId: string
    teacherId: string
    subject: SubjectNameEnum
    dayOfWeek: TimeSlotEnum
    level: LevelEnum
  }>>([])

  async function processExcelFile(event: ChangeEvent<HTMLInputElement>) {
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
      const jsonData: ExcelRowType[] = []
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return // Ignorer l'en-tête

        const rowData: ExcelRowType = {}
        row.eachCell((cell, colNumber) => {
          // Convertir le numéro de colonne en lettre (A, B, C, etc.)
          const columnLetter = String.fromCharCode(64 + colNumber)
          rowData[columnLetter] = cell.value
        })
        jsonData.push(rowData)
      })

      // console.log('Données brutes Excel:', jsonData)

      // Étape 1 : formatage des enseignants
      let teachers: User[] = []
      let warnings: string[] = []
      let mergedTeachersLocal: Array<{
        originalId: string
        mergedId: string
        name: string
        subjects: string[]
      }> = []
      try {
        const result = formatTeachersFromExcelWithWarnings(jsonData)
        teachers = result.teachers
        warnings = result.warnings
        mergedTeachersLocal = result.mergedTeachers
        setTeachersFormatted(teachers)
        setTeacherWarnings(warnings)
        setMergedTeachers(mergedTeachersLocal)
        setTeacherStepMessage(
          `Étape 1 : Intégration des enseignants avec succès (${teachers.length}
           enseignants formatés).`,
        )
      } catch (err: any) {
        setTeacherStepMessage('Erreur lors de l\'intégration des enseignants : ' + err.message)
        setTeachersFormatted(null)
        setTeacherWarnings([])
      }

      // Étape 2 : formatage des cours
      let courses: CourseSessionDataType[] = []
      let courseWarningsLocal: string[] = []
      try {
        const result = formatCoursesFromExcel(jsonData)
        courses = result.courses
        courseWarningsLocal = result.warnings || []
        setCoursesFormatted(courses)
        setCourseWarnings(courseWarningsLocal)
        setCourseStepMessage(
          `Étape 2 : Intégration des cours avec succès (${courses.length} cours formatés).`,
        )
      } catch (err: any) {
        setCourseStepMessage('Erreur lors de l\'intégration des cours : ' + err.message)
        setCoursesFormatted(null)
        setCourseWarnings([])
      }

      // Étape 3 : formatage des étudiants
      let students: User[] = []
      let warningsRed: string[] = []
      let warningsYellow: string[] = []
      try {
        const result = formatStudentsFromExcelWithWarnings(jsonData)
        students = result.students
        warningsRed = result.missingTeacherIdWarnings
        warningsYellow = result.missingContactWarnings
        setStudentsFormatted(students)
        setStudentWarningsRed(warningsRed)
        setStudentWarningsYellow(warningsYellow)
        setStudentCourses(result.studentCourses)
        setStudentStepMessage(
          `Étape 3 : Intégration des étudiants avec succès (${students.length} étudiants formatés)`,
        )
      } catch (err: any) {
        setStudentStepMessage('Erreur lors de l\'intégration des étudiants : ' + err.message)
        setStudentsFormatted(null)
        setStudentWarningsRed([])
        setStudentWarningsYellow([])
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

  async function launchDatabaseImport() {
    setIsImporting(true)
    setImportResult(null)
    console.log('mergedTeachers', mergedTeachers)
    try {
      const response = await fetch('/api/import-school-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teachers: teachersFormatted,
          courses: coursesFormatted,
          students: studentsFormatted,
          mergedTeachers,
          year: ACADEMIC_YEAR,
        }),
      })

      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error || 'Import échoué')
      }

      setImportResult({
        success: true,
        message: 'Import réussi',
        logs: data.logs || [],
      })
    } catch (err: any) {
      setImportResult({
        success: false,
        message: 'Erreur lors de l\'import',
        error: err?.message,
      })
    }
    setIsImporting(false)
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
          onChange={processExcelFile}
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
            <b>Colonne A à F (Élève) :</b>
          </li>
          <li>Colonne A : Nom</li>
          <li>Colonne B : Prénom</li>
          <li>Colonne C : ID_Lien (ID_Prof)</li>
          <li>Colonne D : Sexe_E</li>
          <li>Colonne E : Date_Naiss (JJ/MM/AAAA)</li>
          <li>Colonne F : Email_E</li>
          <li className="mt-2">
            <b>Colonne G à M (Professeur) :</b>
          </li>
          <li>Colonne G : ID_Prof</li>
          <li>Colonne H : Prenom_P</li>
          <li>Colonne I : Nom_P</li>
          <li>Colonne J : Email_P</li>
          <li>Colonne K : Sexe_P</li>
          <li>Colonne L : Tel_P</li>
          <li>Colonne M : Matière</li>
          <li className="mt-2">
            <b>Colonne N à P (Cours) :</b>
          </li>
          <li>Colonne N : Créneau</li>
          <li>Colonne O : Salle</li>
          <li>Colonne P : Niveau</li>
          <li className="mt-2">
            <b>Colonne Q à R (Parents) :</b>
          </li>
          <li>Colonne Q : Tel_Pere</li>
          <li>Colonne R : Tel_Mere</li>
          <li className="mt-2">
            <b>Colonne S à X (Famille & frais) :</b>
          </li>
          <li>Colonne S : Divorce</li>
          <li>Colonne T : Frais Inscription</li>
          <li>Colonne U : Paiement Inscription</li>
          <li>Colonne V : Frais Cotisation</li>
          <li>Colonne W : Paiement Cotisation</li>
          <li>Colonne X : Notes</li>
        </ul>
      </div>

      {loading && (
        <div className="text-center py-4">
          <p>Traitement en cours...</p>
        </div>
      )}

      {teacherStepMessage && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          {teacherStepMessage}
        </div>
      )}

      {teacherWarnings.length > 0 && (
        <div className="mt-2 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-300">
          <b>Attention : Les champs suivants sont manquants pour certains enseignants :</b>
          <ul className="list-disc ml-6 mt-1">
            {teacherWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {mergedTeachers.length > 0 && (
        <div className="mt-2 p-4 bg-green-50 text-green-800 rounded-md border border-green-300">
          <b>Fusions effectuées :</b>
          <ul className="list-disc ml-6 mt-1">
            {mergedTeachers.map((m, i) => (
              <li key={i}>
                {m.name} : ID {m.originalId} fusionné avec ID {m.mergedId}
                <br />
                Matières : {m.subjects.join(', ')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {teachersFormatted && teachersFormatted.length > 0 && (
        <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border mt-2">
          <pre className="text-sm">{JSON.stringify(teachersFormatted, null, 2)}</pre>
        </div>
      )}

      {courseStepMessage && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          {courseStepMessage}
        </div>
      )}

      {courseWarnings.length > 0 && (
        <div className="mt-2 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-300">
          <b>Attention : Les champs suivants sont non reconnus pour certains cours :</b>
          <ul className="list-disc ml-6 mt-1">
            {courseWarnings.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {coursesFormatted && coursesFormatted.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Horaires des cours :</h3>
          <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Professeur</th>
                  <th className="px-4 py-2">Jour</th>
                  <th className="px-4 py-2">Début</th>
                  <th className="px-4 py-2">Fin</th>
                  <th className="px-4 py-2">Matière</th>
                  <th className="px-4 py-2">Niveau</th>
                </tr>
              </thead>
              <tbody>
                {coursesFormatted.map((course, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{course.teacherId}</td>
                    <td className="px-4 py-2">{course.dayOfWeek}</td>
                    <td className="px-4 py-2">{course.startTime}</td>
                    <td className="px-4 py-2">{course.endTime}</td>
                    <td className="px-4 py-2">{course.subject}</td>
                    <td className="px-4 py-2">{course.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {studentStepMessage && (
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">
          {studentStepMessage}
        </div>
      )}

      {studentWarningsRed.length > 0 && (
        <div className="mt-2 p-4 bg-red-50 text-red-800 rounded-md border border-red-300">
          <b>
            Attention : Les étudiants suivants n&apos;ont pas d&apos;ID Professeur (ligne ignorée à
            l&apos;import) :
          </b>
          <ul className="list-disc ml-6 mt-1">
            {studentWarningsRed.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {studentWarningsYellow.length > 0 && (
        <div className="mt-2 p-4 bg-yellow-50 text-yellow-800 rounded-md border border-yellow-300">
          <b>Attention : Les champs suivants sont manquants pour certains étudiants :</b>
          <ul className="list-disc ml-6 mt-1">
            {studentWarningsYellow.map((w, i) => (
              <li key={i}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {studentCourses.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-2">Liens élèves-cours :</h3>
          <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border">
            <table className="min-w-full">
              <thead>
                <tr>
                  <th className="px-4 py-2">Élève</th>
                  <th className="px-4 py-2">Professeur</th>
                  <th className="px-4 py-2">Matière</th>
                  <th className="px-4 py-2">Jour</th>
                  <th className="px-4 py-2">Niveau</th>
                </tr>
              </thead>
              <tbody>
                {studentCourses.map((link, i) => (
                  <tr key={i} className="border-t">
                    <td className="px-4 py-2">{link.studentId}</td>
                    <td className="px-4 py-2">{link.teacherId}</td>
                    <td className="px-4 py-2">{link.subject}</td>
                    <td className="px-4 py-2">{link.dayOfWeek}</td>
                    <td className="px-4 py-2">{link.level}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {result && result.error && (
        <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-md">{result.error}</div>
      )}

      {studentsFormatted && studentsFormatted.length > 0 && (
        <div className="mt-6 flex flex-col items-center">
          <button
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700
                     disabled:opacity-50"
            onClick={launchDatabaseImport}
            disabled={isImporting}
          >
            {isImporting ? 'Import en cours...' : 'Lancer l\'import en base'}
          </button>
          {isImporting && (
            <div className="mt-2 text-blue-600">Veuillez patienter, import en cours...</div>
          )}
          {importResult && (
            <div
              className={`mt-4 p-4 rounded-md ${
                importResult.success
                  ? 'bg-green-50 text-green-700 border border-green-300'
                  : 'bg-red-50 text-red-700 border border-red-300'
              }`}
            >
              <b>{importResult.success ? 'Import réussi !' : 'Erreur lors de l\'import'}</b>
              <div className="mt-2">{importResult.message}</div>
              {importResult.logs && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">
                  {importResult.logs.join('\n')}
                </pre>
              )}
              {importResult.error && (
                <pre className="mt-2 text-xs bg-red-100 p-2 rounded">{importResult.error}</pre>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default ExcelConverter
