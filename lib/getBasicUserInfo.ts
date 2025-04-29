import {Student, Teacher} from '@/types/user'

import {getOneStudent} from '@/app/actions/context/students'
import {getOneTeacher} from '@/app/actions/context/teachers'

export async function getBasicUserInfo(
  type: 'teacher' | 'student',
  id: string,
): Promise<{firstname: string; lastname: string; email: string} | null> {
  try {
    // Utiliser vos server actions existantes
    const response = type === 'teacher' ? await getOneTeacher(id) : await getOneStudent(id)

    if (response.success && response.data) {
      const formattedData = response.data as unknown as Teacher | unknown as Student

      return {
        firstname: formattedData.firstname,
        lastname: formattedData.lastname,
        email: formattedData.email,
      }
    }
    return null
  } catch (error) {
    console.error(`Error fetching basic info for ${type}:`, error)
    return null
  }
}
