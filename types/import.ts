import { LevelEnum, SubjectNameEnum, TimeEnum,TimeSlotEnum } from '@/types/courses'
import { User } from '@/types/db'
import { FeePaymentMethod } from '@/types/fees-payload'
import { UserRoleEnum, UserType } from '@/types/user'

// Interface spécifique pour l'import
export interface ImportStudent extends User {
  teacherId: string;
  divorce?: boolean;
  registrationFee?: number | null;
  registrationPayment?: number | null;
  registrationPaymentMethod?: FeePaymentMethod | null;
  membershipFee?: number | null;
  membershipPayment?: number | null;
  membershipPaymentMethod?: FeePaymentMethod | null;
  notes?: string | null;
  password?: string;
}

export type Teacher = User & {
  role: UserRoleEnum.Teacher
  password?: string;
}

export interface CourseSessionDataType {
  teacherId: string; // Colonne I
  subject: string; // Colonne O
  dayOfWeek: string; // Colonne P
  classroomNumber: string; // Colonne Q
  level: string; // Colonne R
  startTime: string;
  endTime: string;
}

export interface ExcelRow {
  [key: string]: any;
}

export interface ProcessedData {
  lastName: string; // Colonne A
  firstName: string; // Colonne B
  teacher: string; // Colonne C
  level: string; // Colonne D
  classRoomNumber: string; // Colonne E
  dayOfWeek: TimeSlotEnum; // Colonne F
  startTime: string; // Colonne G
  endTime: string; // Colonne H
  gender: string; // Colonne I
  dateOfBirth: string; // Colonne J
  email: string; // Colonne K
  phone: string; // Colonne L
}

export interface StudentDataType {
  lastName: string; // Colonne A
  firstName: string; // Colonne B
  teacherId: string; // Colonne C (ID_Lien = ID_Prof)
  gender: string; // Colonne D
  dateOfBirth: string; // Colonne E
  email: string; // Colonne F
  fatherPhone: string; // Colonne Q
  motherPhone: string; // Colonne R
  divorce: string; // Colonne S
  registrationFee: string; // Colonne T
  registrationPayment: string; // Colonne U
  membershipFee: string; // Colonne V
  membershipPayment: string; // Colonne W
  notes: string; // Colonne X
}

export interface TeacherDataType {
  id: string; // Colonne G
  firstName: string; // Colonne H (Prenom_P)
  lastName: string; // Colonne I (Nom_P)
  email: string; // Colonne J (Email_P)
  gender: string; // Colonne K (Sexe_P)
  phone: string; // Colonne L (Tel_P)
}

export interface ExcelRowType {
  [key: string]: any;
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

function parseAmount(value: string): number | null {
  if (!value) return null
  const normalized = value
    .replace(/\s/g, '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')
  const parsed = Number.parseFloat(normalized)
  return Number.isNaN(parsed) ? null : parsed
}

function parseBoolean(value: string): boolean {
  if (!value) return false
  const normalized = value.trim().toLowerCase()
  return ['oui', 'o', 'true', '1', 'vrai', 'yes'].includes(normalized)
}

function parsePaymentMethod(value: string): FeePaymentMethod | null {
  if (!value) return null
  const normalized = value.trim().toLowerCase()

  if (normalized.includes('cheque') || normalized.includes('chèque') || normalized.includes('cheq'))
    return 'cheque'
  if (normalized.includes('espece') || normalized.includes('espèce'))
    return 'espece'
  if (normalized.includes('liquide') || normalized.includes('cash'))
    return 'liquide'
  if (normalized.includes('cb') || normalized.includes('carte'))
    return 'cb'
  if (normalized.includes('helloasso'))
    return 'helloasso'
  if (normalized.includes('exoner'))
    return 'exoneration'

  return null
}

function parseDateOfBirth(value: string): Date | null {
  if (!value) return null
  
  // Si c'est déjà un objet Date
  if (value instanceof Date) {
    return value
  }
  
  const dateStr = String(value).trim()
  if (!dateStr) return null
  
  // Parser les formats "JJ/MM/AAAA" ou "J/M/AAAA"
  // eslint-disable-next-line no-useless-escape
  const dateParts = dateStr.split(/[\/.\-]/)
  if (dateParts.length === 3) {
    const day = dateParts[0].padStart(2, '0')
    const month = dateParts[1].padStart(2, '0')
    const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2]
    const isoDate = `${year}-${month}-${day}`
    const parsedDate = new Date(isoDate)
    // Vérifier que la date est valide
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate
    }
  }
  
  // Essayer de parser directement avec Date
  const directParse = new Date(dateStr)
  if (!Number.isNaN(directParse.getTime())) {
    return directParse
  }
  
  return null
}

function parsePaymentInfo(
  value: string,
  amountDueRaw: string,
): { amount: number | null; method: FeePaymentMethod | null } {
  const amountDue = parseAmount(amountDueRaw)
  const amount = parseAmount(value)
  const method = parsePaymentMethod(value)
  const resolvedAmount = amount ?? (method ? amountDue : null)

  return {
    amount: resolvedAmount ?? null,
    method,
  }
}

// Formatage des cours (matières multiples, pas de filtrage strict)
export function formatCoursesFromExcel(data: ExcelRowType[]): {
  courses: CourseSessionDataType[];
  warnings: string[];
} {
  const courses: CourseSessionDataType[] = []
  const warnings: string[] = []

  // Map pour regrouper les cours par professeur et créneau
  const courseMap = new Map<
    string,
    {
      firstPeriod: CourseSessionDataType | null;
      secondPeriod: CourseSessionDataType | null;
    }
  >()

  data.forEach((row, idx) => {
    const teacherId = getCellString(row['G']) || getCellString(row['C'])
    const subjectRaw = getCellString(row['M'])
    const dayOfWeekRaw = getCellString(row['N'])
    const classroomNumber = getCellString(row['O'])
    const levelRaw = getCellString(row['P'])

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

    if (!teacherId || !dayOfWeek || !level) return

    const key = `${teacherId}|${dayOfWeek}|${classroomNumber}|${level}`

    if (!courseMap.has(key)) {
      // Premier cours pour ce créneau
      const timeSlot = extractTimeSlot(dayOfWeek)

      // On crée toujours les deux périodes
      courseMap.set(key, {
        firstPeriod: {
          teacherId,
          subject: subjects[0], // Si une seule matière, on la met dans les deux périodes
          dayOfWeek,
          classroomNumber,
          level,
          startTime: timeSlot.start,
          endTime: timeSlot.pause,
        },
        secondPeriod: {
          teacherId,
          // Si une seule matière, on la met dans les deux périodes
          subject: subjects[1] || subjects[0],
          dayOfWeek,
          classroomNumber,
          level,
          startTime: timeSlot.pause,
          endTime: timeSlot.end,
        },
      })
    } else {
      // Mise à jour des cours existants
      const existing = courseMap.get(key)!
      const timeSlot = extractTimeSlot(dayOfWeek)

      // On met à jour les deux périodes
      existing.firstPeriod = {
        teacherId,
        subject: subjects[0] || existing.firstPeriod?.subject || subjects[0],
        dayOfWeek,
        classroomNumber,
        level,
        startTime: timeSlot.start,
        endTime: timeSlot.pause,
      }

      existing.secondPeriod = {
        teacherId,
        subject: subjects[1] || existing.secondPeriod?.subject || subjects[0],
        dayOfWeek,
        classroomNumber,
        level,
        startTime: timeSlot.pause,
        endTime: timeSlot.end,
      }
    }
  })

  // Convertir la Map en tableau de cours
  courseMap.forEach(({ firstPeriod, secondPeriod }) => {
    if (firstPeriod) courses.push(firstPeriod)
    if (secondPeriod) courses.push(secondPeriod)
  })

  return { courses, warnings }
}

// Fonction pour extraire les horaires selon le créneau
function extractTimeSlot(dayOfWeek: string) {
  const timeMap = {
    saturday_morning: {
      start: TimeEnum.MorningStart,
      pause: TimeEnum.MorningPause,
      end: TimeEnum.MorningEnd,
    },
    saturday_afternoon: {
      start: TimeEnum.AfternoonStart,
      pause: TimeEnum.AfternoonPause,
      end: TimeEnum.AfternoonEnd,
    },
    sunday_morning: {
      start: TimeEnum.MorningStart,
      pause: TimeEnum.MorningPause,
      end: TimeEnum.MorningEnd,
    },
  }
  return (
    timeMap[dayOfWeek as keyof typeof timeMap] || {
      start: TimeEnum.MorningStart,
      pause: TimeEnum.MorningPause,
      end: TimeEnum.MorningEnd,
    }
  )
}

export function formatStudentsFromExcelWithWarnings(data: ExcelRowType[]): {
  students: ImportStudent[]
  missingTeacherIdWarnings: string[]
  missingContactWarnings: string[]
  studentCourses: Array<{
    studentId: string
    teacherId: string
    subject: SubjectNameEnum
    dayOfWeek: TimeSlotEnum
    level: LevelEnum
  }>
} {
  const students: ImportStudent[] = []
  const missingTeacherIdWarnings: string[] = []
  const missingContactWarnings: string[] = []
  const studentCourses: Array<{
    studentId: string
    teacherId: string
    subject: SubjectNameEnum
    dayOfWeek: TimeSlotEnum
    level: LevelEnum
  }> = []

  data.forEach((row, idx) => {
    const lastName = getCellString(row['A'])
    const firstName = getCellString(row['B'])
    const teacherId = getCellString(row['C']) || getCellString(row['G'])
    const gender = getCellString(row['D'])
    const dateOfBirth = getCellString(row['E'])
    const email = getCellString(row['F'])
    const phone = getCellString(row['Q'])
    const secondaryPhone = getCellString(row['R'])
    const divorceRaw = getCellString(row['S'])
    const registrationFeeRaw = getCellString(row['T'])
    const registrationPaymentRaw = getCellString(row['U'])
    const membershipFeeRaw = getCellString(row['V'])
    const membershipPaymentRaw = getCellString(row['W'])
    const notesRaw = getCellString(row['X'])

    const registrationPaymentInfo = parsePaymentInfo(
      registrationPaymentRaw,
      registrationFeeRaw,
    )
    const membershipPaymentInfo = parsePaymentInfo(
      membershipPaymentRaw,
      membershipFeeRaw,
    )

    if (!teacherId) {
      const msg = `Ligne ${idx + 2} : Pas d'ID Professeur pour ${firstName} ${lastName}`
      missingTeacherIdWarnings.push(msg)
      return
    }

    if (!email && !phone && !secondaryPhone) {
      const msg = `Ligne ${idx + 2} : Pas de contact (email/téléphone) pour ` +
        `${firstName} ${lastName}`
      missingContactWarnings.push(msg)
    }

    const student: ImportStudent = {
      id: '', // Sera généré par la base de données
      auth_id_email: '', // Sera généré par la base de données
      auth_id_gmail: null,
      parent2_auth_id_email: null,
      parent2_auth_id_gmail: null,
      firstname: firstName,
      lastname: lastName,
      email: email || '',
      secondary_email: null,
      is_active: true,
      deleted_at: null,
      date_of_birth: parseDateOfBirth(dateOfBirth),
      gender: gender || null,
      type: UserType.Student,
      subjects: null,
      school_year: null,
      stats_model: null,
      student_stats_id: null,
      teacher_stats_id: null,
      role: UserRoleEnum.Student,
      phone: phone || '',
      secondary_phone: secondaryPhone || '',
      created_at: null,
      updated_at: null,
      has_invalid_email: false,
      teacherId,
      divorce: parseBoolean(divorceRaw),
      registrationFee: parseAmount(registrationFeeRaw),
      registrationPayment: registrationPaymentInfo.amount,
      registrationPaymentMethod: registrationPaymentInfo.method,
      membershipFee: parseAmount(membershipFeeRaw),
      membershipPayment: membershipPaymentInfo.amount,
      membershipPaymentMethod: membershipPaymentInfo.method,
      notes: notesRaw || null,
      password: undefined,
    }

    students.push(student)
  })

  return {
    students,
    missingTeacherIdWarnings,
    missingContactWarnings,
    studentCourses,
  }
}

// Formatage enseignants avec warnings
export function formatTeachersFromExcelWithWarnings(data: ExcelRowType[]): {
  teachers: Teacher[]
  warnings: string[]
  mergedTeachers: Array<{
    originalId: string
    mergedId: string
    name: string
    subjects: string[]
  }>
} {
  const teachers: Teacher[] = []
  const warnings: string[] = []
  const mergedTeachers: Array<{
    originalId: string
    mergedId: string
    name: string
    subjects: string[]
  }> = []
  const teacherById = new Map<string, Teacher>()

  data.forEach((row, idx) => {
    const id = getCellString(row['G'])
    const firstName = getCellString(row['H'])
    const lastName = getCellString(row['I'])
    const email = getCellString(row['J'])
    const gender = getCellString(row['K'])
    const phone = getCellString(row['L'])
    const subjectsRaw = getCellString(row['M'])

    if (!id || !firstName || !email) {
      const msg = `Ligne ${idx + 2} : Champs obligatoires manquants pour l'enseignant`
      warnings.push(msg)
      return
    }

    const resolvedLastName = lastName || firstName
    if (!lastName) {
      warnings.push(`Ligne ${idx + 2} : Nom du professeur manquant, prénom utilisé`)
    }

    const subjects = subjectsRaw
      .split(',')
      .map((s) => parseSubject(s))
      .filter(Boolean) as SubjectNameEnum[]

    if (subjects.length === 0) {
      const msg = `Ligne ${idx + 2} : Aucune matière valide pour ${firstName} ${lastName}`
      warnings.push(msg)
    }

    const existingTeacher = teacherById.get(id)
    if (existingTeacher) {
      existingTeacher.subjects = Array.from(
        new Set([...(existingTeacher.subjects ?? []), ...subjects]),
      )
      return
    }

    const teacher: Teacher = {
      id, // ID externe pour le mapping
      auth_id_email: '', // Sera généré par la base de données
      auth_id_gmail: null,
      parent2_auth_id_email: null,
      parent2_auth_id_gmail: null,
      firstname: firstName,
      lastname: resolvedLastName,
      email,
      secondary_email: null,
      is_active: true,
      deleted_at: null,
      date_of_birth: null,
      gender: gender || null,
      type: null,
      subjects,
      school_year: null,
      stats_model: null,
      student_stats_id: null,
      teacher_stats_id: null,
      role: UserRoleEnum.Teacher,
      phone: phone || '',
      created_at: null,
      updated_at: null,
      has_invalid_email: false,
      password: undefined,
    }

    teacherById.set(id, teacher)
  })

  teachers.push(...teacherById.values())

  return {
    teachers,
    warnings,
    mergedTeachers,
  }
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
    const teacher = row['C']
      ? String(row['C']).trim()
      : (row['G'] ? String(row['G']).trim() : '')
    const level = row['P'] ? String(row['P']).trim() : ''
    const classRoomNumber = row['O'] ? String(row['O']).trim() : ''

    // Jour de créneau (TimeSlotEnum)
    const dayOfWeek =
      row['N'] &&
      Object.values(TimeSlotEnum).includes(
        String(row['N']).trim() as TimeSlotEnum,
      )
        ? (String(row['N']).trim() as TimeSlotEnum)
        : undefined

    // Heure de début et de fin
    const timeSlot = dayOfWeek ? extractTimeSlot(dayOfWeek) : null
    const startTime = timeSlot?.start ?? ''
    const endTime = timeSlot?.end ?? ''

    // Genre
    let gender = ''
    if (row['D']) {
      const genderValue = String(row['D']).trim().toUpperCase()
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

    // Date de naissance (colonne E)
    let dateOfBirth = ''
    if (row['E']) {
      const dateValue = row['E']
      if (dateValue instanceof Date) {
        dateOfBirth = dateValue.toISOString().split('T')[0]
      } else if (typeof dateValue === 'string') {
        // eslint-disable-next-line no-useless-escape
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

    // Email (colonne F)
    const email = row['F'] ? String(row['F']).trim() : ''
    // Téléphone (colonne Q)
    let phone = ''
    if (row['Q']) {
      const phoneStr = String(row['Q'])
      const phoneNumber = phoneStr.split(/[\\/;,]/)[0].trim()
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

    if (!isEmptyObject(processedItem)) {
      processedData.push(processedItem)
    }
  })

  return processedData
}
