import {StudentDocument} from '@/types/mongoose'
import {Student, Teacher} from '@/types/user'

// Fonction pour calculer les emails valides
export function calculateValidEmails(
  selectedIds: Student[] | StudentDocument[] | string[],
  students?: (Student | StudentDocument | Teacher)[] | null,
): string[] {
  if (!students || !selectedIds) return []

  return students
    ?.filter((user) => selectedIds.includes((user._id as any).toString()))
    .flatMap((user) => {
      const emails = []

      // Email principal (s'il n'est pas invalide)
      if (user.email && user.email !== process.env.INVALID_EMAIL) {
        emails.push(user.email)
      }

      // Email secondaire (pour les students uniquement)
      if (
        'secondaryEmail' in user &&
        user.secondaryEmail &&
        user.secondaryEmail !== process.env.INVALID_EMAIL &&
        user.secondaryEmail !== ''
      ) {
        emails.push(user.secondaryEmail)
      }

      return emails
    })
    .filter(Boolean)
}

export const isValidStudent = (student: Student | StudentDocument) => {
  return (
    (student.email && student.email !== process.env.INVALID_EMAIL) ||
    (student.secondaryEmail &&
      student.secondaryEmail !== process.env.INVALID_EMAIL &&
      student.secondaryEmail !== '')
  )
}
