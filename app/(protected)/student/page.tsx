import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { Student } from '@/types/user'

import StudentDashboard from '@/components/organisms/client/StudentDashboard'

import { getAllStudents } from '@/app/actions/context/students'
import { authOptions } from '@/lib/authOptions'

export const metadata = {
  title: 'Dashboard Étudiant | École',
  description: 'Visualisez les informations scolaires de vos enfants',
}

export default async function StudentPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const familyStudents = await getStudentDataByEmail(session.user.email)

  async function getStudentDataByEmail(email: string): Promise<Student[]> {
    try {
      const studentsResponse = await getAllStudents()

      let studentsArray: Student[] = []

      if (Array.isArray(studentsResponse)) {
        studentsArray = studentsResponse
      } else if (studentsResponse && typeof studentsResponse === 'object') {
        // Cas où c'est un objet de réponse API comme { success: true, data: [...] }
        if (
          'data' in studentsResponse &&
          Array.isArray(studentsResponse.data)
        ) {
          studentsArray = studentsResponse.data as unknown as Student[]
        } else {
          // Peut-être un autre format - à adapter selon votre API
          console.error('Format de données inattendu:', studentsResponse)
          return []
        }
      }

      return studentsArray.filter(
        (student) =>
          student.email === email &&
          student.role === 'student' &&
          student.isActive === true,
      )
    } catch (error) {
      console.error('Erreur lors de la récupération des étudiants:', error)
      return []
    }
  }

  return (
    <div className="flex flex-col bg-slate-50">
      <main className="flex-1 container">
        <StudentDashboard familyStudents={familyStudents} />
      </main>
    </div>
  )
}
