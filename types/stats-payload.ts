import { SubjectNameEnum } from './courses'
import { Database } from './db'
import { GenderEnum } from './user'

// Types de base pour les statistiques
export type StudentStatsPayload = {
  attendanceRate: number
  totalAbsences: number
  behaviorAverage: number
}

export type TeacherStatsPayload = {
  attendanceRate: number
  totalSessions: number
}

// Types pour les réponses API
export type GlobalStatsResponse = {
  presenceRate: number
  totalStudents: number
  totalTeachers: number
  lastUpdate: string
}

export type StudentAttendanceResponse = {
  attendanceRate: number
  totalAbsences: number
  absences: StudentAbsence[]
  lastUpdate: string
}

export type StudentBehaviorResponse = {
  behaviorAverage: number
  totalIncidents: number
  lastUpdate: string
}

export type StudentGradeResponse = {
  grades: Record<string, number>
  average: number
  lastUpdate: string
}

// Types pour les statistiques de cours
export type CourseStats = {
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

// Types pour les statistiques d'absence
export type StudentAbsence = {
  date: Date
  course: string
  reason?: string
}

// Types pour les statistiques d'étudiant
export type StudentStats = {
  userId: string
  absencesRate: number
  absencesCount: number
  behaviorAverage: number
  absences: StudentAbsence[]
  grades: CourseStats
  lastActivity: Date | null
  lastUpdate?: Date
}

// Types pour les statistiques de professeur
export type TeacherStats = {
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

// Type d'union pour les statistiques d'entité
export type EntityStats = StudentStats | TeacherStats

// Types pour les mises à jour de statistiques
export type UpdateStudentStatsPayload = Database['stats']['Tables']['student_stats']['Update']
export type UpdateTeacherStatsPayload = Database['stats']['Tables']['teacher_stats']['Update']
export type UpdateGlobalStatsPayload = Database['stats']['Tables']['global_stats']['Update']

// Types pour les insertions de statistiques
export type InsertStudentStatsPayload = Database['stats']['Tables']['student_stats']['Insert']
export type InsertTeacherStatsPayload = Database['stats']['Tables']['teacher_stats']['Insert']
export type InsertGlobalStatsPayload = Database['stats']['Tables']['global_stats']['Insert']

// Types pour les statistiques de notes
export type GradeStats = {
  stats_average_grade: number
  stats_highest_grade: number
  stats_lowest_grade: number
  stats_absent_count: number
  stats_total_students: number
}

// Types pour les statistiques de comportement
export type BehaviorStats = {
  behavior_rate: number
  total_students: number
  last_update: string
}

/**
 * Interface pour les statistiques de mise à jour
 */
export interface UpdateStats {
  totalStudents: number
  updatedStudents: number
  skippedStudents: number
  studentsWithoutData: number
  statsChanges: Array<{
    studentId: string
    studentName: string
    oldStats: Partial<StudentStats>
    newStats: StudentStats
    differences: string[]
  }>
}
