import { getToken } from 'next-auth/jwt'
import { NextRequest, NextResponse } from 'next/server'
import { GenderEnum } from '@/types/mongo/user'

import dbConnect from '@/zOLDbackend/config/dbConnect'
import { Course } from '@/zOLDbackend/models/zOLDcourse.model'
import { User } from '@/zOLDbackend/models/zOLDuser.model'
import fs from 'fs'
import path from 'path'

// Type pour l'étudiant du fichier JSON
interface StudentJsonData {
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  email: string
  phone: string
  teacher: string // Nom du professeur
  level: string
  classRoomNumber: string
  dayOfWeek: string
}

// Type pour l'étudiant de la base de données
interface StudentDbData {
  _id: any
  firstname: string
  lastname: string
  dateOfBirth?: Date
  gender?: string
  email: string
  phone?: string
  role: string
  isActive: boolean
  [key: string]: any
}

// Type pour les infos du professeur
interface TeacherInfo {
  id: string
  firstname: string
  lastname: string
  fullname: string // Pour faciliter la comparaison
}

// Type pour le résultat du rapport
interface ComparisonReport {
  dateGenerated: string
  studentsInJson: number
  studentsInDatabase: number
  matchingStudents: {
    id: string
    firstname: string
    lastname: string
    email: string
    teacher?: {
      id: string
      name: string
    }
    discrepancies: {
      field: string
      jsonValue: any
      dbValue: any
    }[]
  }[]
  onlyInDatabase: {
    id: string
    firstname: string
    lastname: string
    email: string
    teacher?: {
      id: string
      name: string
    }
  }[]
  onlyInJson: {
    firstname: string
    lastname: string
    email: string
    teacher?: string
  }[]
}

// IDs des étudiants à ignorer (étudiants de test)
const STUDENTS_TO_IGNORE = [
  '66a23f4e1bfe6a163d1af199',
  '66efe63b2a020db80e54201b',
  '66efe65d2a020db80e54206a',
  '670222b9593643b354331533',
  '670a372426f60597c5345f06',
  '670a3b5f26ee7f88a78daf45',
]

// Fonction pour générer une clé à partir du nom et prénom
function generateNameKey(lastName: string, firstName: string): string {
  return `${lastName.toLowerCase().trim()}_${firstName.toLowerCase().trim()}`
}

// Fonction pour calculer un score de correspondance entre un étudiant JSON et un étudiant DB
function calculateMatchScore(jsonStudent: StudentJsonData, dbStudent: any): number {
  let score = 0

  // Nom et prénom correspondent déjà (c'est la base de notre clé)
  score += 10

  // Email
  if (
    jsonStudent.email &&
    dbStudent.email &&
    jsonStudent.email.toLowerCase() === dbStudent.email.toLowerCase()
  ) {
    score += 5
  }

  // Date de naissance
  if (jsonStudent.dateOfBirth && dbStudent.dateOfBirth) {
    const jsonDate = new Date(jsonStudent.dateOfBirth).toISOString().split('T')[0]
    const dbDate = new Date(dbStudent.dateOfBirth).toISOString().split('T')[0]
    if (jsonDate === dbDate) {
      score += 3
    }
  }

  // Genre
  const normalizedJsonGender = normalizeGender(jsonStudent.gender)
  if (normalizedJsonGender && normalizedJsonGender === dbStudent.gender) {
    score += 2
  }

  // Téléphone
  if (jsonStudent.phone && dbStudent.phone && jsonStudent.phone === dbStudent.phone) {
    score += 1
  }

  return score
}

// Fonction pour trouver les divergences entre un étudiant JSON et un étudiant DB
function findDiscrepancies(
  jsonStudent: StudentJsonData,
  dbStudent: any,
  teacherInfo?: {dbTeacher?: TeacherInfo; jsonTeacherName?: string},
) {
  const discrepancies: {field: string; jsonValue: any; dbValue: any}[] = []

  // Email (ne pas considérer comme une divergence si le champ est vide dans la base)
  if (jsonStudent.email && dbStudent.email && jsonStudent.email !== dbStudent.email) {
    discrepancies.push({
      field: 'email',
      jsonValue: jsonStudent.email,
      dbValue: dbStudent.email,
    })
  }

  // Date de naissance
  const jsonDate = jsonStudent.dateOfBirth ? new Date(jsonStudent.dateOfBirth) : null
  const dbDate = dbStudent.dateOfBirth ? new Date(dbStudent.dateOfBirth) : null

  if (
    (jsonDate &&
      dbDate &&
      jsonDate.toISOString().split('T')[0] !== dbDate.toISOString().split('T')[0]) ||
    (jsonDate && !dbDate) ||
    (!jsonDate && dbDate)
  ) {
    discrepancies.push({
      field: 'date de naissance',
      jsonValue: jsonStudent.dateOfBirth,
      dbValue: dbStudent.dateOfBirth
        ? new Date(dbStudent.dateOfBirth).toISOString().split('T')[0]
        : null,
    })
  }

  // Genre - utiliser l'énumération correcte
  const normalizedJsonGender = normalizeGender(jsonStudent.gender)
  if (normalizedJsonGender !== dbStudent.gender) {
    discrepancies.push({
      field: 'genre',
      jsonValue: normalizedJsonGender || jsonStudent.gender,
      dbValue: dbStudent.gender,
    })
  }

  // Téléphone
  if (jsonStudent.phone !== dbStudent.phone) {
    discrepancies.push({
      field: 'téléphone',
      jsonValue: jsonStudent.phone,
      dbValue: dbStudent.phone,
    })
  }

  // Professeur
  if (teacherInfo?.dbTeacher && teacherInfo?.jsonTeacherName) {
    const dbTeacherName = teacherInfo.dbTeacher.fullname
    const jsonTeacherName = teacherInfo.jsonTeacherName

    // Vérifier si les noms des professeurs sont différents
    // Normaliser les noms pour la comparaison (enlever espaces, tout en minuscules)
    const normalizedDbTeacherName = dbTeacherName.toLowerCase().replace(/\s+/g, '')
    const normalizedJsonTeacherName = jsonTeacherName.toLowerCase().replace(/\s+/g, '')

    if (normalizedDbTeacherName !== normalizedJsonTeacherName) {
      discrepancies.push({
        field: 'professeur',
        jsonValue: jsonTeacherName,
        dbValue: dbTeacherName,
      })
    }
  } else if (teacherInfo?.jsonTeacherName && !teacherInfo?.dbTeacher) {
    // Cas où l'étudiant a un professeur dans le JSON mais pas dans la base
    discrepancies.push({
      field: 'professeur',
      jsonValue: teacherInfo.jsonTeacherName,
      dbValue: '(aucun)',
    })
  } else if (!teacherInfo?.jsonTeacherName && teacherInfo?.dbTeacher) {
    // Cas où l'étudiant a un professeur dans la base mais pas dans le JSON
    discrepancies.push({
      field: 'professeur',
      jsonValue: '(aucun)',
      dbValue: teacherInfo.dbTeacher.fullname,
    })
  }

  return discrepancies
}

function normalizeGender(gender: string): string | undefined {
  if (!gender) return undefined

  const lowerGender = gender.toLowerCase().trim()

  // Utiliser les valeurs exactes de l'énumération GenderEnum
  if (
    lowerGender === 'masculin' ||
    lowerGender === 'm' ||
    lowerGender === 'homme' ||
    lowerGender === 'male'
  ) {
    return GenderEnum.Masculin
  } else if (
    lowerGender === 'feminin' ||
    lowerGender === 'féminin' ||
    lowerGender === 'f' ||
    lowerGender === 'femme' ||
    lowerGender === 'female'
  ) {
    return GenderEnum.Feminin
  }

  return undefined
}

// Fonction pour récupérer les informations du professeur d'un étudiant
async function getTeacherForStudent(studentId: string): Promise<TeacherInfo | null> {
  try {
    // Trouver tous les cours où l'étudiant est inscrit
    const courses = await Course.find({
      'sessions.students': studentId,
      isActive: true,
    }).lean()

    if (!courses || courses.length === 0) {
      return null
    }

    // Récupérer le premier professeur trouvé (on pourrait aussi prendre le plus récent)
    // Si plusieurs professeurs, on prend le premier
    const teacherId = courses[0].teacher[0]

    // Récupérer les informations du professeur
    const teacher = await User.findOne({
      _id: teacherId,
      role: 'teacher',
      isActive: true,
    }).lean()

    if (!teacher) {
      return null
    }
    return {
      id: (teacher as any)._id.toString(),
      firstname: (teacher as any).firstname,
      lastname: (teacher as any).lastname,
      fullname: `${(teacher as any).firstname} ${(teacher as any).lastname}`,
    }
  } catch (error) {
    console.error('Erreur lors de la récupération du professeur:', error)
    return null
  }
}

export async function POST(req: NextRequest) {
  // Authentification
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET })
  if (!token?.user) {
    return NextResponse.json({
      status: 401,
      statusText: 'Identifiez-vous d\'abord pour accéder à cette ressource',
    })
  }

  try {
    // Connexion à la base de données
    await dbConnect()

    // Lire le fichier JSON
    const jsonFilePath = path.join(
      process.cwd(),
      'app/admin/compare-students/données_pour_comparaison.json',
    )
    const jsonData = JSON.parse(fs.readFileSync(jsonFilePath, 'utf8')) as StudentJsonData[]

    // Récupérer tous les étudiants de la base de données (en excluant ceux à ignorer)
    const dbStudents = await User.find({
      role: 'student',
      isActive: true,
      _id: { $nin: STUDENTS_TO_IGNORE },
    }).lean()

    // Créer les structures pour la comparaison
    const report: ComparisonReport = {
      dateGenerated: new Date().toISOString(),
      studentsInJson: jsonData.length,
      studentsInDatabase: dbStudents.length,
      matchingStudents: [],
      onlyInDatabase: [],
      onlyInJson: [],
    }

    // Map pour vérification rapide - clé = "nom_prénom"
    const dbStudentsByNameKey = new Map()
    const jsonStudentsByNameKey = new Map()
    const matchedDbStudents = new Set() // Pour suivre les étudiants déjà associés
    const matchedJsonStudents = new Set() // Pour suivre les étudiants déjà associés

    // Préparer les maps pour une recherche efficace
    dbStudents.forEach((student: any) => {
      if (student.lastname && student.firstname) {
        const key = generateNameKey(student.lastname, student.firstname)
        if (!dbStudentsByNameKey.has(key)) {
          dbStudentsByNameKey.set(key, [])
        }
        dbStudentsByNameKey.get(key).push(student)
      }
    })

    jsonData.forEach((student) => {
      if (student.lastName && student.firstName) {
        const key = generateNameKey(student.lastName, student.firstName)
        if (!jsonStudentsByNameKey.has(key)) {
          jsonStudentsByNameKey.set(key, [])
        }
        jsonStudentsByNameKey.get(key).push(student)
      }
    })

    // 1. Trouver les étudiants qui existent dans les deux sources
    for (const [nameKey, jsonStudentsArray] of Array.from(jsonStudentsByNameKey.entries())) {
      // Pour chaque clé nom_prénom du JSON
      if (dbStudentsByNameKey.has(nameKey)) {
        const dbStudentsArray = dbStudentsByNameKey.get(nameKey)

        // Pour chaque étudiant JSON avec cette clé
        for (const jsonStudent of jsonStudentsArray) {
          // S'il n'a pas encore été associé
          if (!matchedJsonStudents.has(jsonStudent)) {
            let bestMatch = null
            let bestMatchScore = -1

            // Chercher le meilleur match parmi les étudiants DB avec la même clé
            for (const dbStudent of dbStudentsArray) {
              if (!matchedDbStudents.has(dbStudent)) {
                const score = calculateMatchScore(jsonStudent, dbStudent)
                if (score > bestMatchScore) {
                  bestMatchScore = score
                  bestMatch = dbStudent
                }
              }
            }

            // Si un match a été trouvé
            if (bestMatch) {
              // Récupérer le professeur de cet étudiant
              const teacherInfo = await getTeacherForStudent(bestMatch._id.toString())

              const discrepancies = findDiscrepancies(jsonStudent, bestMatch, {
                dbTeacher: teacherInfo || undefined,
                jsonTeacherName: jsonStudent.teacher || undefined,
              })

              const matchingStudent = {
                id: bestMatch._id.toString(),
                firstname: bestMatch.firstname,
                lastname: bestMatch.lastname,
                email: bestMatch.email,
                discrepancies,
              }

              // Ajouter l'info du professeur si disponible
              if (teacherInfo) {
                ;(matchingStudent as any).teacher = {
                  id: teacherInfo.id,
                  name: teacherInfo.fullname,
                }
              }

              report.matchingStudents.push(matchingStudent)

              // Marquer les deux comme associés
              matchedJsonStudents.add(jsonStudent)
              matchedDbStudents.add(bestMatch)
            }
          }
        }
      }
    }

    // 2. Trouver les étudiants qui existent uniquement dans le JSON
    for (const jsonStudent of jsonData) {
      if (!matchedJsonStudents.has(jsonStudent)) {
        report.onlyInJson.push({
          firstname: jsonStudent.firstName,
          lastname: jsonStudent.lastName,
          email: jsonStudent.email,
          teacher: jsonStudent.teacher || undefined,
        })
      }
    }

    // 3. Trouver les étudiants qui existent uniquement dans la base de données
    for (const dbStudent of dbStudents) {
      if (!matchedDbStudents.has(dbStudent)) {
        const studentEntry = {
          id: (dbStudent as any)._id.toString(),
          firstname: dbStudent.firstname,
          lastname: dbStudent.lastname,
          email: dbStudent.email,
        }

        // Récupérer le professeur si possible
        const teacherInfo = await getTeacherForStudent((dbStudent as any)._id.toString())
        if (teacherInfo) {
          ;(studentEntry as any).teacher = {
            id: teacherInfo.id,
            name: teacherInfo.fullname,
          }
        }

        report.onlyInDatabase.push(studentEntry)
      }
    }

    // Trier les listes par ordre alphabétique sur les noms
    report.matchingStudents.sort((a, b) => {
      if (a.lastname === b.lastname) {
        return a.firstname.localeCompare(b.firstname)
      }
      return a.lastname.localeCompare(b.lastname)
    })

    report.onlyInDatabase.sort((a, b) => {
      if (a.lastname === b.lastname) {
        return a.firstname.localeCompare(b.firstname)
      }
      return a.lastname.localeCompare(b.lastname)
    })

    report.onlyInJson.sort((a, b) => {
      if (a.lastname === b.lastname) {
        return a.firstname.localeCompare(b.firstname)
      }
      return a.lastname.localeCompare(b.lastname)
    })

    // Générer le rapport dans le dossier reports
    const reportsDir = path.join(process.cwd(), 'reports')
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true })
    }

    const reportPath = path.join(reportsDir, `students_comparison_${Date.now()}.json`)
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))

    return NextResponse.json({
      message: 'Comparaison terminée avec succès',
      reportPath,
      summary: {
        totalInJson: report.studentsInJson,
        totalInDatabase: report.studentsInDatabase,
        matching: report.matchingStudents.length,
        onlyInJson: report.onlyInJson.length,
        onlyInDatabase: report.onlyInDatabase.length,
      },
      report, // Inclure le rapport directement dans la réponse
    })
  } catch (error) {
    console.error('Erreur lors de la comparaison:', error)
    return NextResponse.json(
      {
        message: 'Erreur lors de la comparaison',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}

// API pour récupérer un rapport existant
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const reportPath = url.searchParams.get('path')

  if (!reportPath) {
    return NextResponse.json({ message: 'Chemin du rapport manquant' }, { status: 400 })
  }

  try {
    // Vérifier si le chemin est dans le dossier reports pour des raisons de sécurité
    const fullPath = path.resolve(process.cwd(), reportPath)
    if (!fullPath.startsWith(path.resolve(process.cwd(), 'reports'))) {
      return NextResponse.json({ message: 'Chemin non autorisé' }, { status: 403 })
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json({ message: 'Rapport non trouvé' }, { status: 404 })
    }

    // Lire le fichier
    const reportContent = fs.readFileSync(fullPath, 'utf8')
    const reportData = JSON.parse(reportContent)

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Erreur lors de la récupération du rapport:', error)
    return NextResponse.json(
      {
        message: 'Erreur lors de la récupération du rapport',
        error: (error as Error).message,
      },
      { status: 500 },
    )
  }
}
