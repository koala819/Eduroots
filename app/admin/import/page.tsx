'use client'

import React, { ChangeEvent, useState } from 'react'
import ExcelJS from 'exceljs'
import { ProcessedData as ProcessedDataType, CourseSessionDataType, ExcelRow as ExcelRowType, formatCoursesFromExcel, processExcelData, formatStudentsFromExcelWithWarnings, formatTeachersFromExcelWithWarnings } from '@/zUnused/import'
import { fetchWithAuth } from '@/server/utils/fetchWithAuth'
import type { Student, Teacher } from '@/zUnused/types/user'
import { SubjectNameEnum, LevelEnum } from '@/zUnused/types/course'
import { TimeSlotEnum } from '@/types/courses'

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
  const [teachersFormatted, setTeachersFormatted] = useState<Teacher[] | null>(null)
  const [coursesFormatted, setCoursesFormatted] = useState<CourseSessionDataType[] | null>(null)
  const [courseStepMessage, setCourseStepMessage] = useState<string | null>(null)
  const [teacherWarnings, setTeacherWarnings] = useState<string[]>([])
  const [studentsFormatted, setStudentsFormatted] = useState<Student[] | null>(null)
  const [studentStepMessage, setStudentStepMessage] = useState<string | null>(null)
  const [studentWarningsRed, setStudentWarningsRed] = useState<string[]>([])
  const [studentWarningsYellow, setStudentWarningsYellow] = useState<string[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: boolean, message: string, logs?: string[], error?: string } | null>(null)
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
          const columnLetter = String.fromCharCode(64 + colNumber) // Convertir le numéro de colonne en lettre (A, B, C, etc.)
          rowData[columnLetter] = cell.value
        })
        jsonData.push(rowData)
      })

      // console.log('Données brutes Excel:', jsonData)

      // Étape 1 : formatage des enseignants
      let teachers: Teacher[] = []
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
          `Étape 1 : Intégration des enseignants avec succès (${teachers.length} enseignants formatés).`,
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
        setCourseStepMessage(`Étape 2 : Intégration des cours avec succès (${courses.length} cours formatés).`)
      } catch (err: any) {
        setCourseStepMessage('Erreur lors de l\'intégration des cours : ' + err.message)
        setCoursesFormatted(null)
        setCourseWarnings([])
      }

      // Étape 3 : formatage des étudiants
      let students: Student[] = []
      let warningsRed: string[] = []
      let warningsYellow: string[] = []
      try {
        const result = formatStudentsFromExcelWithWarnings(jsonData)
        students = result.students as Student[]
        warningsRed = result.missingTeacherIdWarnings
        warningsYellow = result.missingContactWarnings
        setStudentsFormatted(students as Student[])
        setStudentWarningsRed(warningsRed)
        setStudentWarningsYellow(warningsYellow)
        setStudentCourses(result.studentCourses)
        setStudentStepMessage(`Étape 3 : Intégration des étudiants avec succès (${students.length} étudiants formatés)`)
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
      const response = await fetchWithAuth('/api/newDb', {
        method: 'POST',
        body: {
          teachers: teachersFormatted,
          courses: coursesFormatted,
          students: studentsFormatted,
          mergedTeachers: mergedTeachers,
          year: ACADEMIC_YEAR,
        },
      })
      setImportResult(response)
    } catch (err: any) {
      setImportResult({ success: false, message: 'Erreur inconnue', error: err?.message })
    }
    setIsImporting(false)
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
          <li>Colonne O : Matière</li>
          <li className="mt-2">
            <b>Colonne P à R (Cours) :</b>
          </li>
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
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">{courseStepMessage}</div>
      )}
      {courseStepMessage && coursesFormatted && coursesFormatted.length > 0 && (
        <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border mt-2">
          <pre className="text-sm">{JSON.stringify(coursesFormatted, null, 2)}</pre>
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
        <div className="mt-4 p-4 bg-blue-50 text-blue-700 rounded-md">{studentStepMessage}</div>
      )}
      {studentStepMessage && studentsFormatted && studentsFormatted.length > 0 && (
        <div className="overflow-auto max-h-96 p-4 bg-gray-50 rounded border mt-2">
          <pre className="text-sm">{JSON.stringify(studentsFormatted, null, 2)}</pre>
        </div>
      )}

      {studentWarningsRed.length > 0 && (
        <div className="mt-2 p-4 bg-red-50 text-red-800 rounded-md border border-red-300">
          <b>Attention : Les étudiants suivants n&apos;ont pas d&apos;ID Professeur (ligne ignorée à l&apos;import) :</b>
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
            className="px-6 py-2 bg-blue-600 text-white rounded-md font-semibold hover:bg-blue-700 disabled:opacity-50"
            onClick={launchDatabaseImport}
            disabled={isImporting}
          >
            {isImporting ? 'Import en cours...' : 'Lancer l\'import en base'}
          </button>
          {isImporting && (
            <div className="mt-2 text-blue-600">Veuillez patienter, import en cours...</div>
          )}
          {importResult && (
            <div className={`mt-4 p-4 rounded-md ${importResult.success ? 'bg-green-50 text-green-700 border border-green-300' : 'bg-red-50 text-red-700 border border-red-300'}`}>
              <b>{importResult.success ? 'Import réussi !' : 'Erreur lors de l\'import'}</b>
              <div className="mt-2">{importResult.message}</div>
              {importResult.logs && (
                <pre className="mt-2 text-xs bg-gray-100 p-2 rounded">{importResult.logs.join('\n')}</pre>
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
