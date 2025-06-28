'use server'

import { updateStudent } from '@/server/actions/api/students'
import { UpdateStudentPayload } from '@/types/student-payload'

interface UpdateStudentAdminData {
  studentId: string
  firstname: string
  lastname: string
  email: string
  secondaryEmail?: string
  gender: string
  dateOfBirth?: string
}

export async function updateStudentAdminAction(data: UpdateStudentAdminData) {
  try {
    // Convertir les données au format UpdateStudentPayload
    const updatePayload: UpdateStudentPayload = {
      firstname: data.firstname,
      lastname: data.lastname,
      email: data.email,
      secondary_email: data.secondaryEmail,
      gender: data.gender,
      date_of_birth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
    }

    const response = await updateStudent(data.studentId, updatePayload)

    if (!response.success) {
      return {
        success: false,
        message: response.message,
      }
    }

    return {
      success: true,
      message: response.message,
    }
  } catch (error) {
    console.error('Erreur lors de la mise à jour:', error)
    return {
      success: false,
      message: 'Erreur lors de la mise à jour des informations',
    }
  }
}
