'use client'

import { useCallback, useState } from 'react'

import { Student } from '@/types/user'

import { fetchWithAuth } from '@/lib/fetchWithAuth'
import * as ExcelJS from 'exceljs'

interface ExcelRow {
  [key: string]: any
}

const XlsToJsonUserUpdate: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [loadingMessage, setLoadingMessage] = useState<string>('')
  const [processedData, setProcessedData] = useState<
    { _id: string; dateOfBirth: string }[] | null
  >(null)
  const [error, setError] = useState<string | null>(null)
  const [backup, setBackup] = useState<Student[] | null>(null)

  const parseDate = (dateValue: any): string | undefined => {
    if (!dateValue) return undefined

    let date: Date | undefined

    if (dateValue instanceof Date) {
      date = dateValue
    } else if (typeof dateValue === 'number') {
      date = new Date((dateValue - 25569) * 86400 * 1000)
    } else if (typeof dateValue === 'string') {
      const parts = dateValue.split('/')
      if (parts.length === 3) {
        const [day, month, year] = parts.map(Number)
        if (!isNaN(day) && !isNaN(month) && !isNaN(year)) {
          date = new Date(year, month - 1, day)
        }
      } else {
        date = new Date(dateValue)
      }
    }

    if (date && !isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]
    }

    console.warn(`Format de date non reconnu: ${dateValue}`)
    return undefined
  }

  const processExcelData = useCallback(
    (rows: ExcelRow[]): Partial<Student>[] => {
      return rows
        .map((row): Partial<Student> => {
          const [lastname, firstname] = row.Eleve
            ? row.Eleve.split(' ')
            : [undefined, undefined]
          const dateOfBirth = parseDate(row['DATE DE NAISSANCE'])

          if (dateOfBirth) {
            // console.log(
            //   `Date parsed for ${firstname} ${lastname}: ${dateOfBirth}`,
            // )
          } else {
            console.warn(
              `Unable to parse date for ${firstname} ${lastname}: ${row['DATE DE NAISSANCE']}`,
            )
          }

          return {
            firstname: firstname,
            lastname: lastname,
            dateOfBirth: dateOfBirth,
          }
        })
        .filter((user) => user.firstname && user.lastname && user.dateOfBirth)
    },
    [],
  )

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setLoadingMessage('Lecture du fichier XLS...')
    setError(null)

    try {
      const workbook = new ExcelJS.Workbook()
      const arrayBuffer = await file.arrayBuffer()
      await workbook.xlsx.load(arrayBuffer)

      setLoadingMessage('Conversion des données...')
      const worksheet = workbook.worksheets[0]
      const jsonData: ExcelRow[] = []

      worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
        if (rowNumber === 1) return // Skip header row
        const rowData: ExcelRow = {}
        row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
          const header = worksheet.getRow(1).getCell(colNumber).value?.toString()
          if (header) {
            rowData[header] = cell.value
          }
        })
        jsonData.push(rowData)
      })

      setLoadingMessage('Validation et transformation des données...')
      const transformedData = processExcelData(jsonData)

      setLoadingMessage('Récupération des données existantes...')
      const response = await fetchWithAuth('/api/users/student', {
        method: 'GET',
      })

      if (response.status !== 200) {
        throw new Error(
          `Error fetching existing users: ${response.statusText}`,
        )
      }

      const existingUsers = response.data

      const updates = transformedData
        .map((newData) => {
          const existingUser = existingUsers.find(
            (user: Student) =>
              user.firstname.toLowerCase() ===
                newData.firstname?.toLowerCase() &&
              user.lastname.toLowerCase() === newData.lastname?.toLowerCase(),
          )
          if (
            existingUser &&
            newData.dateOfBirth &&
            existingUser.dateOfBirth !== newData.dateOfBirth
          ) {
            return { _id: existingUser._id, dateOfBirth: newData.dateOfBirth }
          }
          return null
        })
        .filter(
          (update): update is { _id: string; dateOfBirth: string } =>
            update !== null,
        )

      setProcessedData(updates)
      setLoadingMessage('Données prêtes pour la mise à jour !')
    } catch (error) {
      console.error('Erreur lors de la conversion:', error)
      setError(
        `Une erreur est survenue lors de la conversion: ${error instanceof Error ? error.message : String(error)}`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!processedData) return

    setIsLoading(true)
    setLoadingMessage('Mise à jour des données...')

    try {
      const response = await fetchWithAuth('/api/XlsToJsonUserUpdate', {
        method: 'POST',
        body: processedData,
      })

      if (response.status !== 200) {
        throw new Error(`Error updating users: ${response.statusText}`)
      }

      setBackup(response.backup)
      setLoadingMessage('Mise à jour réussie!')
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error)
      setError(
        `Une erreur est survenue lors de la mise à jour: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  const handleRestore = async () => {
    if (!backup) return

    setIsLoading(true)
    setLoadingMessage('Restauration des données...')

    try {
      const response = await fetchWithAuth('/api/XlsToJsonUserUpdate', {
        method: 'PUT',
        body: JSON.stringify({ backup }),
      })

      if (response.status !== 200) {
        throw new Error(`Error restoring backup: ${response.statusText}`)
      }

      setLoadingMessage('Restauration réussie!')
      setProcessedData(null)
      setBackup(null)
    } catch (error) {
      console.error('Erreur lors de la restauration:', error)
      setError(
        `Une erreur est survenue lors de la restauration: ${
          error instanceof Error ? error.message : String(error)
        }`,
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">
        Mise à jour des dates de naissance via XLS
      </h1>
      <input
        type="file"
        accept=".xls,.xlsx"
        onChange={handleFileUpload}
        className="mb-4 p-2 border rounded"
      />
      {isLoading && (
        <div className="mb-4">
          <p>{loadingMessage}</p>
          <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
            <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
          </div>
        </div>
      )}
      {error && (
        <div className="mb-4 text-red-500">
          <p>Erreur : {error}</p>
        </div>
      )}
      {processedData && (
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Données prêtes pour la mise à jour :
          </h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(processedData, null, 2)}
          </pre>
          <button
            onClick={handleUpdate}
            className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Mettre à jour les données
          </button>
        </div>
      )}
      {backup && (
        <button
          onClick={handleRestore}
          className="mt-4 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
        >
          Restaurer la sauvegarde
        </button>
      )}
    </div>
  )
}

export default XlsToJsonUserUpdate
