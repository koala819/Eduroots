import { getStudentsByTeacher } from '@/app/actions/context/teachers'
import ChatCenter from '@/components/organisms/client/ChatCenter'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { Student } from '@/types/user'

export default async function TeacherMessagesPage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.email) {
    redirect('/')
  }

  const response = await getStudentsByTeacher(session.user.id)

  if (!response.success) {
    throw new Error(response.message || 'Erreur lors de la récupération des étudiants')
  }

  // Extraire les étudiants uniques de tous les cours
  const allStudents = new Set<string>()
  const coursesData = response.data as any[]

  coursesData.forEach((course) => {
    course.sessions.forEach((session: any) => {
      session.students.forEach((student: Student) => {
        allStudents.add(JSON.stringify(student))
      })
    })
  })

  const uniqueStudents =Array
    .from(allStudents)
    .map((student: string) => JSON.parse(student) as Student)

  return <ChatCenter students={uniqueStudents} courses={coursesData} />
}
