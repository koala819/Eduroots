import {getServerSession} from 'next-auth'
import {redirect} from 'next/navigation'

import {Student} from '@/types/user'

import StudentInfo from '@/components/organisms/server/StudentInfo'

import {getAllStudents} from '@/app/actions/context/students'
import {authOptions} from '@/lib/authOptions'

export default async function FamilyPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const familyData = await getStudentDataByEmail(session.user.email)

  async function getStudentDataByEmail(email: string): Promise<Student[]> {
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

  return (
    <div className="container mx-auto px-4 py-8">
      <StudentInfo data={familyData} />
    </div>
  )
}
