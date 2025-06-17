import { redirect } from 'next/navigation'
import { StudentResponse } from '@/types/student-payload'
import StudentInfo from '@/server/components/organisms/StudentInfo'
import { getAllStudents } from '@/server/actions/api/students'
import { getAuthenticatedUser } from '@/server/utils/auth-helpers'

export default async function StudentProfilePage() {
  const user = await getAuthenticatedUser()

  if (!user?.email) {
    redirect('/')
  }

  const familyData = await getStudentDataByEmail(user.email)

  async function getStudentDataByEmail(email: string): Promise<StudentResponse[]> {
    try {
      const studentsResponse = await getAllStudents()
      const studentsArray = studentsResponse.data as StudentResponse[]

      return studentsArray.filter(
        (student) =>
          student.email === email && student.type === 'student',
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
