import { getAllStudents } from '@/app/actions/context/students'
import { Student } from '@/types/user'

export async function getFamilyStudents(email: string): Promise<Student[]> {
   try {
      const studentsResponse = await getAllStudents()

      let studentsArray: Student[] = []

      if (Array.isArray(studentsResponse)) {
        studentsArray = studentsResponse
      } else if (studentsResponse && typeof studentsResponse === 'object') {
        // Cas où c'est un objet de réponse API comme { success: true, data: [...] }
        if ('data' in studentsResponse && Array.isArray(studentsResponse.data)) {
          studentsArray = studentsResponse.data as unknown as Student[]
        } else {
          // Peut-être un autre format - à adapter selon votre API
          console.error('Format de données inattendu:', studentsResponse)
          return []
        }
      }

      return studentsArray.filter(
        (student) =>
          student.email === email && student.role === 'student' && student.isActive === true,
      )
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error)
      return []
    }
}