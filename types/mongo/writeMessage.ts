export interface FormFields {
  recipients: string[]
}

export type RecipientType =
  | 'bureau'
  | 'studentsForTeacher'
  | 'teachersForBureau'
  | 'studentsForBureau'
  | 'bureau'
  | 'students'
  | null

export type SelectionModeType =
  | 'all'
  | 'allInOne'
  | 'specific'
  | 'bySession'
  | 'manual'
  | 'byTeacher'
  | 'teachersForBureau'
  | 'students'
  | 'studentsForBureau'
  | null
