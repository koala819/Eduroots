import {SubjectNameEnum} from '@/types/course'
import {GenderEnum} from '@/types/user'

export interface AbsenceLevelGroup {
  id: string
  absences: number
  color: string
}

export interface GroupedAbsences {
  [color: string]: AbsenceLevelGroup[]
}

export interface CourseStats {
  [SubjectNameEnum.Arabe]?: {
    average: number
  }
  [SubjectNameEnum.EducationCulturelle]?: {
    average: number
  }
  overallAverage: number
  bySubject?: {
    [SubjectNameEnum.Arabe]?: {
      average: number
    }
    [SubjectNameEnum.EducationCulturelle]?: {
      average: number
    }
    overallAverage: number
  }
}

// Représentation d'une date soit comme un objet Date natif, soit comme une date sérialisée
export type SerializableDate =
  | Date
  | {$date: string}
  | string // Pour les dates sous forme de chaîne ISO
  | number // Pour les timestamps Unix

export interface StudentStats {
  userId: string
  absencesRate: number
  absencesCount: number
  behaviorAverage: number
  absences: {
    date: SerializableDate
    course: string
    reason?: string
  }[]
  grades: CourseStats
  lastActivity: SerializableDate | null
  lastUpdate?: SerializableDate
}

// Types pour les statistiques des professeurs
export interface TeacherStats {
  userId?: string
  totalStudents: number
  genderDistribution: {
    counts: {
      [GenderEnum.Masculin]: number
      [GenderEnum.Feminin]: number
      undefined: number
    }
    percentages: {
      [GenderEnum.Masculin]: string
      [GenderEnum.Feminin]: string
      undefined: string
    }
  }
  minAge: number
  maxAge: number
  averageAge: number
}

// Type d'union pour les deux types de statistiques
export type EntityStats = StudentStats | TeacherStats

// Type guards pour déterminer le type de statistiques
export function isStudentStats(stats: EntityStats): stats is StudentStats {
  return 'absencesRate' in stats
}

export function isTeacherStats(stats: EntityStats): stats is TeacherStats {
  return 'totalStudents' in stats
}

// Type pour les statistiques globales
export interface GlobalStats {
  totalStudents: number
  totalTeachers: number
  lastUpdate: SerializableDate
  presenceRate: number
}

export type EntityType = 'students' | 'teachers'
