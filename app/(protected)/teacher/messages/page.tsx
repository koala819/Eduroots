import { getStudentsByTeacher } from '@/app/actions/context/teachers'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/authOptions'
import { redirect } from 'next/navigation'
import { Student } from '@/types/user'
import { MessagesCenter } from '@/components/pages/client/MessagesCenter'
import { groupSimilarSessions } from '@/lib/messages'


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
  const coursesTeachersWithChildren = response.data as any[]

  coursesTeachersWithChildren.forEach((course) => {
    course.sessions.forEach((session: any) => {
      session.students.forEach((student: Student) => {
        allStudents.add(JSON.stringify(student))
      })
    })
  })

  const uniqueStudents = Array
    .from(allStudents)
    .map((student: string) => JSON.parse(student) as Student)

  // Regrouper les sessions similaires
  const groupedSessions = groupSimilarSessions(coursesTeachersWithChildren[0].sessions)

  return <MessagesCenter
    students={uniqueStudents}
    coursesTeachersWithChildren={groupedSessions}
    userType="teacher"
  />
}
