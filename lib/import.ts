import { TimeEnum, TimeSlotEnum } from '@/types/course'
import { LevelEnum, SubjectNameEnum } from '@/types/course'
import type { Student, Teacher } from '@/types/user'
import { GenderEnum, UserRoleEnum, UserType } from '@/types/user'

// Interface spécifique pour l'import
export interface ImportStudent extends Student {
  teacherId: string
}

export interface CourseSessionDataType {
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

export interface TeacherDataType {
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

// Formatage des cours (matières multiples, pas de filtrage strict)
export function formatCoursesFromExcel(data: ExcelRowType[]): {
  courses: CourseSessionDataType[]
  warnings: string[]
} {
  const courses: CourseSessionDataType[] = []
  const warnings: string[] = []

  // Map pour regrouper les cours par professeur et créneau
  const courseMap = new Map<
    string,
    {
      firstPeriod: CourseSessionDataType | null
      secondPeriod: CourseSessionDataType | null
    }
  >()

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
          subject: subjects[1] || subjects[0], // Si une seule matière, on la met dans les deux périodes
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
    sessionId: string
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
    sessionId: string
    subject: SubjectNameEnum
    dayOfWeek: TimeSlotEnum
    level: LevelEnum
  }> = []

  // D'abord, on récupère tous les cours pour les lier aux élèves
  const courses = formatCoursesFromExcel(data).courses

  data.forEach((row, idx) => {
    const lastName = getCellString(row['A'])
    const firstName = getCellString(row['B'])
    const teacherId = getCellString(row['C'])

    // Vérification stricte des champs requis
    if (!firstName?.trim() || !lastName?.trim()) {
      missingTeacherIdWarnings.push(
        `- Étudiant ligne ${idx + 2} : prénom ou nom manquant`,
      )
      return
    }

    if (!teacherId) {
      missingTeacherIdWarnings.push(
        `- Étudiant ligne ${idx + 2} (${firstName} ${lastName}) : ID Professeur manquant`,
      )
      return
    }

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

    const missing: string[] = []
    if (!email) missing.push('email manquant')
    if (!phone) missing.push('téléphone manquant')
    if (missing.length > 0) {
      missingContactWarnings.push(
        `- ${firstName} ${lastName} : ${missing.join(', ')}`,
      )
    }

    const student: Partial<ImportStudent> = {
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
      teacherId: teacherId || '', // Ajout du teacherId
    }

    // Vérification finale avant d'ajouter
    if (student.firstname && student.lastname) {
      const normalize = (str: string) =>
        str
          .normalize('NFD') // retire les accents
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-zA-Z0-9_-]/g, '') // retire tout sauf lettres, chiffres, _ et -
          .toUpperCase()

      const studentId = `${normalize(lastName)}_${normalize(firstName)}_${idx}`
      students.push({ ...(student as ImportStudent), id: studentId })

      // On cherche les cours correspondant au prof
      const matchingCourses = courses.filter((c) => c.teacherId === teacherId)

      // On ajoute les cours pour cet élève
      matchingCourses.forEach((course) => {
        studentCourses.push({
          studentId,
          teacherId,
          sessionId: course.teacherId,
          subject: course.subject as SubjectNameEnum,
          dayOfWeek: course.dayOfWeek as TimeSlotEnum,
          level: course.level as LevelEnum,
        })
      })
    }
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

  // Map pour stocker les profs par nom+prénom
  const teachersByName = new Map<
    string,
    {
      id: string
      teacher: Partial<Teacher>
      subjects: Set<string>
    }
  >()

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
    const subject = getCellString(row['O'])

    // Si on a déjà vu ce prof
    if (teachersByName.has(nameKey)) {
      const existing = teachersByName.get(nameKey)!
      // Si c'est un ID différent, on fusionne
      if (existing.id !== id) {
        existing.subjects.add(subject)
        mergedTeachers.push({
          originalId: id,
          mergedId: existing.id,
          name: `${firstName} ${lastName}`,
          subjects: Array.from(existing.subjects),
        })
      } else {
        // Même ID, on ajoute juste la matière
        existing.subjects.add(subject)
      }
      return
    }

    // Nouveau prof
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

    // Stocker le prof avec ses matières
    teachersByName.set(nameKey, {
      id,
      teacher,
      subjects: new Set([subject]),
    })

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

  // Convertir les profs en tableau final
  teachersByName.forEach(({ teacher, subjects }) => {
    if (teacher.firstname && teacher.lastname) {
      teachers.push({
        ...(teacher as Teacher),
        subjects: Array.from(subjects)
          .map((s) => parseSubject(s))
          .filter(Boolean) as SubjectNameEnum[],
      })
    }
  })

  return { teachers, warnings, mergedTeachers }
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

    if (!isEmptyObject(processedItem)) {
      processedData.push(processedItem)
    }
  })

  return processedData
}
