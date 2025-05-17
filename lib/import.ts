import { TimeEnum, TimeSlotEnum } from '@/types/course'
import { LevelEnum, SubjectNameEnum } from '@/types/course'
import type { Student, Teacher } from '@/types/user'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

export interface CourseSessionData {
  teacherId: string // Colonne I
  subject: string // Colonne O
  dayOfWeek: string // Colonne P
  classroomNumber: string // Colonne Q
  level: string // Colonne R
  startTime: string
  endTime: string
}

export interface ExcelRow {
  [key: string]: any
}

export interface ProcessedData {
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

export interface StudentDataType {
  lastName: string // Colonne A
  firstName: string // Colonne B
  teacherId: string // Colonne C
  gender: string // Colonne D
  dateOfBirth: string // Colonne E
  email: string // Colonne F
  phone: string // Colonne G
}

export interface TeacherData {
  id: string // Colonne I
  lastName: string // Colonne J
  firstName: string // Colonne K
  email: string // Colonne L
  gender: string // Colonne M
  phone: string // Colonne N
}

export interface ExcelRowType {
  [key: string]: any
}

export interface TeacherDataType {
  id: string
  lastName: string
  firstName: string
  email: string
  gender: string
  phone: string
}

export interface CourseSessionDataType {
  teacherId: string
  subject: string
  dayOfWeek: string
  classroomNumber: string
  level: string
  startTime: string
  endTime: string
}

// Helpers de conversion/validation pour les enums
function parseDayOfWeek(value: string): TimeSlotEnum | undefined {
  const normalized = value
    .toLowerCase()
    .replace(/[_\s-]+/g, '') // retire espaces, underscores, tirets
    .replace(/\d{1,2}h\d{0,2}-\d{1,2}h\d{0,2}/g, '') // retire les horaires
    .trim()

  if (normalized.startsWith('samedi') && normalized.includes('mat'))
    return TimeSlotEnum.SATURDAY_MORNING
  if (normalized.startsWith('samedi') && normalized.includes('aprem'))
    return TimeSlotEnum.SATURDAY_AFTERNOON
  if (normalized.startsWith('dimanche') && normalized.includes('mat'))
    return TimeSlotEnum.SUNDAY_MORNING

  return undefined
}

function parseLevel(value: string): LevelEnum | undefined {
  const normalized = value.trim()
  switch (normalized) {
    case '0':
      return LevelEnum.Zero
    case '0-2':
      return LevelEnum.Zero2
    case '1':
      return LevelEnum.One
    case '1-2':
      return LevelEnum.One2
    case '2':
      return LevelEnum.Two
    case '2-2':
      return LevelEnum.Two2
    case '3':
      return LevelEnum.Three
    case '3-2':
      return LevelEnum.Three2
    case '4':
      return LevelEnum.Four
    case '4-2':
      return LevelEnum.Four2
    case '5':
      return LevelEnum.Five
    case '6':
      return LevelEnum.Six
    default:
      return undefined
  }
}

function parseSubject(value: string): SubjectNameEnum | undefined {
  const normalized = value.trim().toLowerCase()
  if (normalized === 'arabe') return SubjectNameEnum.Arabe
  if (normalized.includes('culturelle'))
    return SubjectNameEnum.EducationCulturelle
  return undefined
}

// Fonction pour extraire les horaires selon le créneau
function extractTimeSlot(dayOfWeek: string) {
  const timeMap = {
    saturday_morning: {
      start: TimeEnum.MorningStart,
      end: TimeEnum.MorningEnd,
    },
    saturday_afternoon: {
      start: TimeEnum.AfternoonStart,
      end: TimeEnum.AfternoonEnd,
    },
    sunday_morning: { start: TimeEnum.MorningStart, end: TimeEnum.MorningEnd },
  }
  return (
    timeMap[dayOfWeek as keyof typeof timeMap] || {
      start: TimeEnum.MorningStart,
      end: TimeEnum.MorningEnd,
    }
  )
}

// Formatage des cours (matières multiples, pas de filtrage strict)
export function formatCoursesFromExcel(data: ExcelRowType[]): {
  courses: CourseSessionDataType[]
  warnings: string[]
} {
  const courses: CourseSessionDataType[] = []
  const seen = new Set<string>()
  const warnings: string[] = []

  data.forEach((row, idx) => {
    const teacherId = getCellString(row['I'])
    const subjectRaw = getCellString(row['O'])
    const dayOfWeekRaw = getCellString(row['P'])
    const classroomNumber = getCellString(row['Q'])
    const levelRaw = getCellString(row['R'])

    const subjects = subjectRaw
      .split(',')
      .map((s) => parseSubject(s))
      .filter(Boolean) as SubjectNameEnum[]

    const dayOfWeek = parseDayOfWeek(dayOfWeekRaw)
    const level = parseLevel(levelRaw)

    if (!dayOfWeek && dayOfWeekRaw) {
      warnings.push(
        `Ligne ${idx + 2} : dayOfWeek non reconnu : "${dayOfWeekRaw}"`,
      )
    }
    if (!level && levelRaw) {
      warnings.push(`Ligne ${idx + 2} : level non reconnu : "${levelRaw}"`)
    }
    if (subjects.length === 0 && subjectRaw) {
      warnings.push(`Ligne ${idx + 2} : subject non reconnu : "${subjectRaw}"`)
    }

    subjects.forEach((subject) => {
      const key = `${teacherId}|${subject}|${dayOfWeek}|${classroomNumber}|${level}`
      if (!teacherId || !subject || !dayOfWeek || !level || seen.has(key))
        return
      seen.add(key)
      const timeSlot = extractTimeSlot(dayOfWeek)
      courses.push({
        teacherId,
        subject,
        dayOfWeek,
        classroomNumber,
        level,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
      })
    })
  })

  return { courses, warnings }
}

export function formatStudentsFromExcelWithWarnings(data: ExcelRowType[]): {
  students: Student[]
  missingTeacherIdWarnings: string[]
  missingContactWarnings: string[]
} {
  const students: Student[] = []
  const missingTeacherIdWarnings: string[] = []
  const missingContactWarnings: string[] = []

  data.forEach((row, idx) => {
    const lastName = getCellString(row['A'])
    const firstName = getCellString(row['B'])

    // Vérification stricte des champs requis
    if (!firstName?.trim() || !lastName?.trim()) {
      missingTeacherIdWarnings.push(
        `- Étudiant ligne ${idx + 2} : prénom ou nom manquant`,
      )
      return
    }

    const teacherId = getCellString(row['C'])
    let gender: GenderEnum = GenderEnum.Masculin
    const genderValue = getCellString(row['D']).toLowerCase()
    if (
      genderValue === 'f' ||
      genderValue === 'feminin' ||
      genderValue === 'féminin' ||
      genderValue === 'female'
    ) {
      gender = GenderEnum.Feminin
    } else if (
      genderValue === 'm' ||
      genderValue === 'masculin' ||
      genderValue === 'male'
    ) {
      gender = GenderEnum.Masculin
    }
    const dateOfBirth = getCellString(row['E'])
    const email = getCellString(row['F'])
    const phone = getCellString(row['G']).replace(/[^\d]/g, '')

    if (!teacherId) {
      missingTeacherIdWarnings.push(
        `- Étudiant ligne ${idx + 2} (${firstName} ${lastName}) : ID Professeur manquant`,
      )
    }

    const missing: string[] = []
    if (!email) missing.push('email manquant')
    if (!phone) missing.push('téléphone manquant')
    if (missing.length > 0) {
      missingContactWarnings.push(
        `- ${firstName} ${lastName} : ${missing.join(', ')}`,
      )
    }

    const student: Partial<Student> = {
      email: email?.toLowerCase() || '',
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      password: '', // à compléter côté backend
      role: UserRoleEnum.Student,
      gender,
      phone: phone || '',
      isActive: true,
      deletedAt: null,
      type: UserType.Student,
      dateOfBirth: dateOfBirth || undefined,
    }

    // Vérification finale avant d'ajouter
    if (student.firstname && student.lastname) {
      students.push(student as Student)
    }
  })

  return { students, missingTeacherIdWarnings, missingContactWarnings }
}

// Formatage enseignants avec warnings
export function formatTeachersFromExcelWithWarnings(data: ExcelRowType[]): {
  teachers: Teacher[]
  warnings: string[]
} {
  const teachers: Teacher[] = []
  const warnings: string[] = []
  const nameToIdMap = new Map<string, string>()
  const duplicateNameWarnings: string[] = []

  data.forEach(function (row) {
    const id = getCellString(row['I'])
    if (!id) return

    const lastName = getCellString(row['J'])
    const firstName = getCellString(row['K'])

    // Vérification stricte des champs requis
    if (!firstName?.trim() || !lastName?.trim()) {
      warnings.push(
        `Ligne ignorée : prénom ou nom manquant pour l'enseignant (ID ${id})`,
      )
      return
    }

    const nameKey = `${lastName}|${firstName}`

    // Si déjà vu avec un autre ID, warning et on n'ajoute pas
    if (nameToIdMap.has(nameKey) && nameToIdMap.get(nameKey) !== id) {
      duplicateNameWarnings.push(
        `Conflit d'ID pour l'enseignant ${firstName} ${lastName} : ${nameToIdMap.get(nameKey)} et ${id}`,
      )
      return
    }
    // Si déjà vu avec le même ID, on n'ajoute pas de doublon
    if (nameToIdMap.has(nameKey)) {
      return
    }

    nameToIdMap.set(nameKey, id)

    const email = getCellString(row['L'])
    let gender: GenderEnum = GenderEnum.Masculin
    if (row['M']) {
      const genderValue = getCellString(row['M']).toLowerCase()
      if (
        genderValue === 'f' ||
        genderValue === 'feminin' ||
        genderValue === 'féminin' ||
        genderValue === 'female'
      ) {
        gender = GenderEnum.Feminin
      } else if (
        genderValue === 'm' ||
        genderValue === 'masculin' ||
        genderValue === 'male'
      ) {
        gender = GenderEnum.Masculin
      }
    }
    const phone = getCellString(row['N']).replace(/[^\d]/g, '')

    const teacher: Partial<Teacher> = {
      id: id,
      email: email?.toLowerCase() || 'user@mail.fr',
      firstname: firstName.trim(),
      lastname: lastName.trim(),
      password: '',
      role: UserRoleEnum.Teacher,
      gender,
      phone: phone || '0123456789',
      isActive: true,
      deletedAt: null,
    }

    // Vérification finale avant d'ajouter
    if (teacher.firstname && teacher.lastname) {
      teachers.push(teacher as Teacher)
    }

    // Warnings pour email/téléphone manquant
    const missing: string[] = []
    if (!email) missing.push('email manquant')
    if (!phone) missing.push('téléphone manquant')
    if (missing.length > 0) {
      warnings.push(
        `- ${id} (${firstName} ${lastName}) : ${missing.join(', ')}`,
      )
    }
  })

  warnings.push(...duplicateNameWarnings)

  return { teachers, warnings }
}

// Extraction propre d'une cellule ExcelJS
export function getCellString(cell: any): string {
  if (!cell) return ''
  if (typeof cell === 'string') return cell.trim()
  if (typeof cell === 'object') {
    if ('text' in cell) return String(cell.text).trim()
    if ('hyperlink' in cell)
      return String(cell.hyperlink).replace('mailto:', '').trim()
  }
  return String(cell).trim()
}

// Fonction pour vérifier si un objet est vide (toutes les valeurs sont des chaînes vides)
function isEmptyObject(obj: ProcessedData): boolean {
  return Object.values(obj).every((value) => value === '')
}

// Fonction pour traiter les données Excel
export function processExcelData(data: ExcelRow[]): ProcessedData[] {
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
      row['F'] &&
      Object.values(TimeSlotEnum).includes(
        String(row['F']).trim() as TimeSlotEnum,
      )
        ? (String(row['F']).trim() as TimeSlotEnum)
        : undefined

    // Heure de début et de fin
    const startTime = row['G'] ? String(row['G']).trim() : ''
    const endTime = row['H'] ? String(row['H']).trim() : ''

    // Genre
    let gender = ''
    if (row['I']) {
      const genderValue = String(row['I']).trim().toUpperCase()
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
          const year =
            dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]
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
